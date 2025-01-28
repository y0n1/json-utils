import type { JsonArray, JsonObject, JsonScalar } from "./json.ts";
import type { JsonNode } from "./json_node.ts";

export interface JsonNodeVisitor {
  visitScalar(node: JsonNode<JsonScalar>): void;
  visitArray(node: JsonNode<JsonArray>): void;
  visitObject(node: JsonNode<JsonObject>): void;
}
