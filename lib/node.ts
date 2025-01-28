import {
  isJsonArray,
  isJsonObject,
  type JsonArray,
  type JsonObject,
  type JsonScalar,
  type JsonValue,
} from "./json.ts";
import type { Visitor } from "./visitor.ts";

const refs = new Set<JsonObject | JsonArray>();
function detectCircularReference(nodeValue: JsonObject | JsonArray): void {
  if (refs.has(nodeValue)) {
    throw new TypeError("Converting circular structure");
  } else {
    refs.add(nodeValue);
  }
}

/**
 * Represents a node in a tree structure where each node can be a scalar, array, or object.
 *
 * @template T - The type of the value held by the node, which extends JsonValue.
 */
export class Node<T extends JsonValue> {
  static #toJsonPathSegment(value: string | number): string {
    if (typeof value === "number") {
      return `[${value}]`;
    }

    const regex = /(\s|\.)/;
    return regex.test(value) ? `['${value}']` : `.${value}`;
  }

  readonly #parent: Node<JsonValue> | null;
  readonly #children: Array<Node<JsonValue>> | null;
  readonly #kind: "scalar" | "array" | "object";
  readonly #value: T;
  readonly #jsonpath: Array<string>;
  key: string | number;

  /**
   * Constructs a new Node instance.
   *
   * @param key - The key associated with this node, which can be a string or number.
   * @param value - The value associated with this node.
   * @param parent - The parent node of this node, if any.
   *
   * @throws {TypeError} If the key is not "$" and the parent node is not provided.
   */
  constructor(
    key: string | number,
    value: T,
    parent?: Node<T>,
  ) {
    this.key = key;
    this.#value = value;
    this.#jsonpath = [];

    if (key === "$") {
      this.#parent = null;
      this.#jsonpath.push(key);
    } else {
      if (!parent) {
        throw new TypeError("Parent node is required");
      }

      this.#parent = parent;
      this.#jsonpath.push(
        ...this.#parent.jsonpath,
        `${Node.#toJsonPathSegment(key)}`,
      );
    }

    switch (true) {
      case isJsonArray(value):
        detectCircularReference(value);
        this.#kind = "array";
        this.#children = value.map((jsonValue, idx) =>
          new Node(idx, jsonValue, this)
        );
        break;
      case isJsonObject(value):
        detectCircularReference(value);
        this.#kind = "object";
        this.#children = [];
        for (const [k, jsonValue] of Object.entries(value)) {
          if (typeof jsonValue !== "undefined") {
            this.#children.push(new Node(k, jsonValue, this));
          }
        }
        break;
      default:
        this.#kind = "scalar";
        this.#children = null;
        break;
    }

    if (this.parent === null) {
      refs.clear();
    }
  }

  get value(): T {
    return this.#value;
  }

  get kind(): "scalar" | "array" | "object" {
    return this.#kind;
  }

  get parent(): Node<JsonValue> | null {
    return this.#parent;
  }

  get children(): Array<Node<JsonValue>> | null {
    return this.#children;
  }

  /**
   * Returns the JSONPath expression corresponding to this node's location in the data structure.
   *
   * @returns {string} The JSONPath expression.
   */
  get jsonpath(): string {
    return this.#jsonpath.join("");
  }

  /**
   * Accepts a visitor and calls the appropriate visit method based on the node's kind.
   *
   * @param visitor - The visitor instance that will process the node.
   *
   * The method will call one of the following visitor methods based on the node's kind:
   * - `visitScalar` if the node is a scalar.
   * - `visitArray` if the node is an array.
   * - `visitObject` if the node is an object.
   */
  accept(visitor: Visitor) {
    switch (this.#kind) {
      case "scalar":
        visitor.visitScalar(this as Node<JsonScalar>);
        break;
      case "array":
        visitor.visitArray(this as Node<JsonArray>);
        break;
      case "object":
        visitor.visitObject(this as Node<JsonObject>);
        break;
    }
  }

  /**
   * Converts the current instance to a JSON value.
   *
   * Depending on the type of the instance (`scalar`, `array`, or `object`),
   * this method will return the corresponding JSON representation.
   *
   * - If the instance is a scalar, it returns the scalar value.
   * - If the instance is an array, it returns an array of JSON values by
   *   recursively calling `toJsonValue` on each child.
   * - If the instance is an object, it returns a JSON object by recursively
   *   calling `toJsonValue` on each child and using their keys as the object's keys.
   *
   * @returns {JsonValue} The JSON representation of the current instance.
   */
  toJsonValue(): JsonValue {
    switch (this.#kind) {
      case "scalar":
        return this.#value;
      case "array":
        return this.#children!.map((child) => child.toJsonValue());
      case "object": {
        const obj: JsonObject = {};
        for (const child of this.#children ?? []) {
          obj[child.key] = child.toJsonValue();
        }
        return obj;
      }
    }
  }
}
