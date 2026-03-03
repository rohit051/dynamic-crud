
import mongoose from "mongoose";
import Category from "../models/Category";
import Subcategory from "../models/Subcategory";
import Domain from "../models/Domain";

const models: any = {};
const toEntity = (value: string) => String(value || "").toLowerCase();
const isContentEntity = (entity: string) => ["product", "news"].includes(toEntity(entity));
const isAdmin = (user: any) => String(user?.role || "") === "admin";
const normalizeDomain = (value: string) => toEntity(value);

const hasDomainPermission = (user: any, entity: string) => {
  if (isAdmin(user)) return true;
  const permissions = Array.isArray(user?.domainPermissions)
    ? user.domainPermissions.map((item: string) => normalizeDomain(item))
    : [];
  return permissions.includes(normalizeDomain(entity));
};

const ensureDomainAccess = async (user: any, entity: string) => {
  const domainName = normalizeDomain(entity);
  const domain = await Domain.findOne({ name: domainName, isActive: true });
  if (!domain) return { ok: false, status: 404, message: `Domain '${domainName}' is not available` };
  if (!hasDomainPermission(user, domainName)) {
    return { ok: false, status: 403, message: `Access denied for domain '${domainName}'` };
  }
  return { ok: true };
};

const validateCategorySubcategory = async (categoryId: string, subcategoryId?: string | null, expectedDomainName?: string) => {
  const category = await Category.findById(categoryId);
  if (!category) return { ok: false, message: "Invalid categoryId" };

  if (expectedDomainName && String((category as any).domainName || "").toLowerCase() !== normalizeDomain(expectedDomainName)) {
    return { ok: false, message: `Category must belong to '${normalizeDomain(expectedDomainName)}' domain` };
  }

  if (!subcategoryId) return { ok: true };

  const subcategory = await Subcategory.findById(subcategoryId);
  if (!subcategory) return { ok: false, message: "Invalid subcategoryId" };

  if (String(subcategory.category) !== String(category._id)) {
    return { ok: false, message: "Subcategory does not belong to the selected category" };
  }

  return { ok: true };
};

export const createEntity = async (req: any, res: any) => {
  const { entityName, fields } = req.body;

  const schemaDefinition: any = {};
  Object.keys(fields).forEach((key) => {
    schemaDefinition[key] = { type: String };
  });

  const schema = new mongoose.Schema(schemaDefinition, { timestamps: true });
  models[entityName] = mongoose.model(entityName, schema);

  res.json({ message: `${entityName} model created` });
};

export const handleCRUD = async (req: any, res: any) => {
  const { entity, id } = req.params;
  const entityName = toEntity(entity);

  // prefer dynamically created model, otherwise try registered mongoose models
  let Model = models[entity] || mongoose.models[entity];
  if (!Model) {
    try {
      Model = mongoose.model(entity);
    } catch (err) {
      // model not registered
    }
  }

  if (!Model) return res.status(400).json({ message: "Entity not found" });

  try {
    if (isContentEntity(entityName)) {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const access = await ensureDomainAccess(req.user, entityName);
      if (!access.ok) return res.status(access.status || 403).json({ message: access.message });
    }

    if (req.method === "POST") {
      if (entityName === "category") {
        const domainName = normalizeDomain(String(req.body?.domainName || ""));
        if (!domainName) return res.status(400).json({ message: "domainName is required for category" });
        const domain = await Domain.findOne({ name: domainName, isActive: true });
        if (!domain) return res.status(400).json({ message: `Domain '${domainName}' does not exist` });
        req.body.domainName = domainName;
      }

      if (isContentEntity(entityName)) {
        const { categoryId, subcategoryId } = req.body;
        if (!categoryId) {
          return res.status(400).json({ message: "categoryId is required" });
        }

        const normalizedSubcategoryId = subcategoryId ? String(subcategoryId) : null;

        const validation = await validateCategorySubcategory(String(categoryId), normalizedSubcategoryId, entityName);
        if (!validation.ok) return res.status(400).json({ message: validation.message });

        req.body.subcategoryId = normalizedSubcategoryId;

        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        req.body.createdBy = req.user._id || req.user.id;
      }

      const doc = await Model.create(req.body);
      return res.json(doc);
    }

    if (req.method === "GET") {
      // list all or if id provided, return single
      if (id) {
        const doc = await Model.findById(id);
        if (!doc) return res.status(404).json({ message: "Not found" });
        if (isContentEntity(entityName) && !isAdmin(req.user)) {
          const ownerId = doc.createdBy ? String(doc.createdBy) : "";
          const currentUserId = String(req.user?._id || req.user?.id || "");
          if (ownerId !== currentUserId) return res.status(403).json({ message: "Forbidden" });
        }
        return res.json(doc);
      }
      // support simple pagination on listing
      const page = parseInt(req.query.page as string) || 1;
      // default to 10 items per page
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const query: any = {};
      if (isContentEntity(entityName) && !isAdmin(req.user)) {
        query.createdBy = req.user._id || req.user.id;
      }
      const [docs, total] = await Promise.all([
        Model.find(query).skip(skip).limit(limit),
        Model.countDocuments(query),
      ]);
      const pages = Math.ceil(total / limit);
      return res.json({ docs, total, page, pages });
    }

    if (req.method === "PUT") {
      if (!id) return res.status(400).json({ message: "id required for update" });

      if (entityName === "category" && req.body?.domainName) {
        const domainName = normalizeDomain(String(req.body.domainName));
        const domain = await Domain.findOne({ name: domainName, isActive: true });
        if (!domain) return res.status(400).json({ message: `Domain '${domainName}' does not exist` });
        req.body.domainName = domainName;
      }

      if (isContentEntity(entityName)) {
        const existing = await Model.findById(id);
        if (!existing) return res.status(404).json({ message: "Not found" });

        const ownerId = existing.createdBy ? String(existing.createdBy) : "";
        const currentUserId = req.user ? String(req.user._id || req.user.id) : "";
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        if (!isAdmin(req.user) && ownerId !== currentUserId) {
          return res.status(403).json({ message: "You can edit only your own content" });
        }

        const resolvedCategoryId = req.body.categoryId || existing.categoryId;
        const hasSubcategoryField = Object.prototype.hasOwnProperty.call(req.body, "subcategoryId");
        const incomingSubcategoryId = hasSubcategoryField ? req.body.subcategoryId : undefined;
        const resolvedSubcategoryId = hasSubcategoryField
          ? (incomingSubcategoryId ? String(incomingSubcategoryId) : null)
          : (existing.subcategoryId ? String(existing.subcategoryId) : null);

        if (!resolvedCategoryId) {
          return res.status(400).json({ message: "categoryId is required" });
        }

        const validation = await validateCategorySubcategory(String(resolvedCategoryId), resolvedSubcategoryId, entityName);
        if (!validation.ok) return res.status(400).json({ message: validation.message });

        if (hasSubcategoryField) {
          req.body.subcategoryId = resolvedSubcategoryId;
        }
      }

      const updated = await Model.findByIdAndUpdate(id, req.body, { new: true });
      return res.json(updated);
    }

    if (req.method === "DELETE") {
      if (!id) return res.status(400).json({ message: "id required for delete" });

       if (isContentEntity(entityName)) {
        const existing = await Model.findById(id);
        if (!existing) return res.status(404).json({ message: "Not found" });

        const ownerId = existing.createdBy ? String(existing.createdBy) : "";
        const currentUserId = req.user ? String(req.user._id || req.user.id) : "";
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        if (!isAdmin(req.user) && ownerId !== currentUserId) {
          return res.status(403).json({ message: "You can delete only your own content" });
        }
      }

      await Model.findByIdAndDelete(id);
      return res.json({ message: "deleted" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};
