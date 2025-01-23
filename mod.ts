/**
 * This module provides a function to recursively mutate the keys of JSON objects within an input value using a provided mutator function.
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

/**
 * Recursively mutates the keys of JSON objects within the input value using the provided mutator function.
 *
 * @param input - The input value to process. Must be a valid JSON value.
 * @param onVisitJsonObjectKey - A function that mutates the keys of JSON objects.
 * @param options - Optional configuration for the JSON visitor.
 * @throws {TypeError} If the input is not a valid JSON value.
 *
 * @returns {JsonValue} The input value with the keys of JSON objects mutated.
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
