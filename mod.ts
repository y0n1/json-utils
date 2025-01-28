/**
 * This module provides a set of functions to process nested JSON data structures.
 * @module
 */

import {
  isJsonArray,
  isJsonObject,
  isJsonValue,
  type JsonValue,
} from "./lib/json.ts";
import { Node } from "./lib/node.ts";
import {
  type ObjectKeyMutatorFunction,
  Visitor,
  type VisitorOptions,
} from "./lib/visitor.ts";

export type {
  JsonArray,
  JsonObject,
  JsonScalar,
  JsonValue,
} from "./lib/json.ts";

export type {
  ObjectKeyMutatorFunction,
  VisitorOptions,
} from "./lib/visitor.ts";

/**
 * Recursively transforms the keys of JSON objects within the input value using the provided function.
 *
 * @param input - The input value to process. Must be a valid JSON value.
 * @param onVisitJsonObjectKey - A function that transforms the keys of JSON objects.
 * @param options - Optional configuration for the JSON visitor.
 * @throws {TypeError} If the input is not a valid JSON value.
 *
 * @returns {JsonValue} If the input is a JSON scalar, the same value is returned; otherwise a new JSON (reference) value.
 */
export function deepMapKeys(
  input: unknown,
  onVisitJsonObjectKey: ObjectKeyMutatorFunction,
  options?: VisitorOptions,
): JsonValue {
  if (!isJsonValue(input)) {
    throw new TypeError("Invalid argument type");
  }

  if (
    isJsonObject(input) && Object.keys(input).length === 0 ||
    isJsonArray(input) && input.length === 0
  ) {
    return input;
  }

  const visitor = new Visitor(onVisitJsonObjectKey, options);
  const node = new Node("$", input);
  node.accept(visitor);

  return node.toJsonValue();
}
