
import { Router } from "express";
import { createEntity, handleCRUD } from "../controllers/dynamicController";
import requireRole from "../middleware/requireRole";

const router = Router();

const toEntity = (value: string) => String(value || "").toLowerCase();
const isUserEntity = (entity: string) => toEntity(entity) === "user";
const isTaxonomyEntity = (entity: string) => ["category", "subcategory", "domain"].includes(toEntity(entity));

// only admin can create new dynamic entities
router.post("/generate", requireRole("admin"), createEntity);
router.route("/:entity")
	.post((req, res, next) => {
		if (isUserEntity(req.params.entity) || isTaxonomyEntity(req.params.entity)) {
			return requireRole("admin")(req, res, next);
		}
		next();
	}, handleCRUD)
	.get((req, res, next) => {
		const entity = req.params.entity;
		if (isUserEntity(entity)) {
			return requireRole("admin")(req, res, next);
		}
		next();
	}, handleCRUD);

// support single-entity update/delete and get by id
router.route("/:entity/:id")
	.put((req, res, next) => {
		const entity = req.params.entity;
		if (isUserEntity(entity) || isTaxonomyEntity(entity)) return requireRole("admin")(req, res, next);
		next();
	}, handleCRUD)
	.get((req, res, next) => {
		const entity = req.params.entity;
		if (isUserEntity(entity)) return requireRole("admin")(req, res, next);
		next();
	}, handleCRUD)
	.delete((req, res, next) => {
		const entity = req.params.entity;
		if (isUserEntity(entity) || isTaxonomyEntity(entity)) return requireRole("admin")(req, res, next);
		next();
	}, handleCRUD);

export default router;
