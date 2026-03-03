
import mongoose from "mongoose";

const models: any = {};

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
    if (req.method === "POST") {
      const doc = await Model.create(req.body);
      return res.json(doc);
    }

    if (req.method === "GET") {
      // list all or if id provided, return single
      if (id) {
        const doc = await Model.findById(id);
        return res.json(doc);
      }
      // support simple pagination on listing
      const page = parseInt(req.query.page as string) || 1;
      // default to 10 items per page
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const [docs, total] = await Promise.all([
        Model.find().skip(skip).limit(limit),
        Model.countDocuments(),
      ]);
      const pages = Math.ceil(total / limit);
      return res.json({ docs, total, page, pages });
    }

    if (req.method === "PUT") {
      if (!id) return res.status(400).json({ message: "id required for update" });
      const updated = await Model.findByIdAndUpdate(id, req.body, { new: true });
      return res.json(updated);
    }

    if (req.method === "DELETE") {
      if (!id) return res.status(400).json({ message: "id required for delete" });
      await Model.findByIdAndDelete(id);
      return res.json({ message: "deleted" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};
