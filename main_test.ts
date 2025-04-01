import { assertEquals } from "@std/assert";
import logger from "./libs/logger.ts";

Deno.test(function loggerImportTest() {
  assertEquals(typeof logger, "object", "Logger should be an object");
});