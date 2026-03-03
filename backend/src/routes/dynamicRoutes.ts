
import { Router } from "express";
import { createEntity, handleCRUD } from "../controllers/dynamicController";
import requireRole from "../middleware/requireRole";

const router = Router();

// only admin can create new dynamic entities
router.post("/generate", requireRole("admin"), createEntity);
router.route("/:entity")
	.post(handleCRUD)
	.get((req, res, next) => {
		const entity = req.params.entity;
		// only admin can list users
		if (entity === "User" || entity === "user") {
			return requireRole("admin")(req, res, next);
		}
		next();
	}, handleCRUD);

// support single-entity update/delete and get by id
router.route("/:entity/:id")
	.put((req, res, next) => {
		const entity = req.params.entity;
		if (entity === "User" || entity === "user") return requireRole("admin")(req, res, next);
		next();
	}, handleCRUD)
	.delete((req, res, next) => {
		const entity = req.params.entity;
		if (entity === "User" || entity === "user") return requireRole("admin")(req, res, next);
		next();
	}, handleCRUD);

export default router;
