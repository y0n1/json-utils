/* Sourced from: https://github.com/backstage/backstage/blob/0c5aa5a0071aa5e7bebb68887cd0ebd238613685/packages/types/src/json.ts */

/** A type representing all valid JSON scalar values */
export type JsonScalar = number | string | boolean | null;

/** Asserts `value` is a JsonScalar */
export function isJsonScalar(value: unknown): value is JsonScalar {
  return (
    typeof value === "number" ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    value === null
  );
}

/** A type representing a JSON object */
export type JsonObject = {
  [key in string]?: JsonValue;
};

/** Asserts `value` is a JsonObject non-recursively */
export function isJsonObject(value: unknown): value is JsonObject {
  return value?.constructor.name === "Object";
}

/** A type representing JSON array */
export type JsonArray = Array<JsonValue>;

/** Asserts `value` is an JsonArray non-recursively */
export function isJsonArray(value: unknown): value is JsonArray {
  return Array.isArray(value);
}

/** A type representing all valid JSON values. */
export type JsonValue = JsonObject | JsonArray | JsonScalar;

/** Asserts value is a JsonValue */
export function isJsonValue(value: unknown): value is JsonValue {
  return (
    typeof value !== "undefined" &&
    (
      isJsonScalar(value) ||
      isJsonObject(value) ||
      isJsonArray(value)
    )
  );
}
