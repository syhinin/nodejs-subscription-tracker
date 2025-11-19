import { Router } from "express";

import { sendReminders } from "../controllers/workflow.controller.js";

const workflowRouter = Router();

//TODO move logic to the controller
workflowRouter.post("/subscription/reminder", sendReminders);

export default workflowRouter;
