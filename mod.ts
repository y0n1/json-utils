/**
 * This module provides a set of functions to process nested JSON data structures.
 * @module
 */

import {
  type JsonValue,
  maybeJsonArray,
  maybeJsonObject,
  maybeJsonValue,
} from "./lib/json.ts";
import { JsonNode, type JsonNodeVisitorOptions } from "./lib/json_node.ts";

/**
 * Recursively transforms the keys of JSON objects within the input value using the provided function.
 *
 * @param input - The input value to process. Must be a valid JSON value.
 * @param functionOrOptions - A function that can be used to change the keys in the provided input or a configuration object.
 * @throws {TypeError} If the input is not a valid JSON value.
 *
 * @returns The same value when the input is a JSON scalar, an empty array or empty object; otherwise a new reference value.
 */
export function deepMapKeys(
  input: unknown,
  functionOrOptions:
    | JsonNodeVisitorOptions
    | JsonNodeVisitorOptions["onVisitJsonObjectKey"],
): JsonValue {
  if (!maybeJsonValue(input)) {
    throw new TypeError("Invalid argument type");
  }

  if (
    maybeJsonObject(input) && Object.keys(input).length === 0 ||
    maybeJsonArray(input) && input.length === 0
  ) {
    return input;
  }

  const node = new JsonNode("$", input);
  const visitor = new JsonNode.Visitor(
    typeof functionOrOptions === "function"
      ? { onVisitJsonObjectKey: functionOrOptions }
      : functionOrOptions,
  );
  node.accept(visitor);

  return node.toJsonValue();
}
