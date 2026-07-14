import { Elysia } from "elysia";

const app = new Elysia();

app.get("/health", () => "OK");

export default app;
