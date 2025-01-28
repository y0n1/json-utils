import {
  type JsonArray,
  type JsonObject,
  type JsonScalar,
  type JsonValue,
  maybeJsonArray,
  maybeJsonObject,
} from "./json.ts";
import type { JsonNodeVisitor } from "./json_node_visitor.ts";

const refs = new Set<JsonObject | JsonArray>();
function detectCircularReference(nodeValue: JsonObject | JsonArray): void {
  if (refs.has(nodeValue)) {
    throw new TypeError("Converting circular structure");
  } else {
    refs.add(nodeValue);
  }
}

export type ObjectKeyMutatorFunction = (key: string | number) => string;

/**
 * Options for configuring the JSON visitor.
 */
export interface JsonNodeVisitorOptions {
  /**
   * A list of regular expression matching the JSONPath (RFC 9535) of a key in the data structure.
   * Every time a key is found in the data structure, its JSONPath is tested for a match agains the entries in the list.
   * If at least one match is found, then that key won't be processed by the `JsonNodeVisitorOptions#onVisitJsonObjectKey` callback.
   */
  skipList?: Array<RegExp>;

  /**
   * An optional flag to enable debug mode.
   * When set to true, each time a node is visited, its JSONPath will be logged.
   */
  debug?: boolean;

  /**
   * A function that can be used to process the object keys names.
   * The string returned by this function will be used to replace the name of the object key being visited.
   */
  onVisitJsonObjectKey?: ObjectKeyMutatorFunction;
}

class Visitor implements JsonNodeVisitor {
  readonly #onVisitObjectKey?: ObjectKeyMutatorFunction;
  readonly #skipList: Array<RegExp>;
  readonly #isDebugEnabled: boolean;

  constructor(
    options?: JsonNodeVisitorOptions,
  ) {
    this.#onVisitObjectKey = options?.onVisitJsonObjectKey;
    this.#skipList = options?.skipList ?? [];
    this.#isDebugEnabled = options?.debug ?? false;
  }

  visitScalar(node: JsonNode<JsonScalar>): void {
    if (this.#isDebugEnabled) {
      console.log(node.jsonpath);
    }
  }

  visitArray(node: JsonNode<JsonArray>): void {
    if (this.#isDebugEnabled) {
      console.log(node.jsonpath);
    }

    node.children?.forEach((child) => child.accept(this));
  }

  visitObject(node: JsonNode<JsonObject>): void {
    if (this.#isDebugEnabled) {
      console.log(node.jsonpath);
    }

    node.children?.forEach((child) => {
      const newKey = this.#skipList.some((regex) => regex.test(child.jsonpath))
        ? child.key
        : this.#onVisitObjectKey?.(child.key) ?? child.key;
      child.key = newKey;
      child.accept(this);
    });
  }
}

/** Represents a node in a tree structure where each node can be a scalar, array, or object. */
export class JsonNode<T extends JsonValue> {
  static readonly Visitor = Visitor;
  static #toJsonPathSegment(value: string | number): string {
    if (typeof value === "number") {
      return `[${value}]`;
    }

    const regex = /(\s|\.)/;
    return regex.test(value) ? `['${value}']` : `.${value}`;
  }

  readonly #parent: JsonNode<JsonValue> | null;
  readonly #children: Array<JsonNode<JsonValue>> | null;
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
    parent?: JsonNode<T>,
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
        `${JsonNode.#toJsonPathSegment(key)}`,
      );
    }

    switch (true) {
      case maybeJsonArray(value):
        detectCircularReference(value);
        this.#kind = "array";
        this.#children = value.map((jsonValue, idx) =>
          new JsonNode(idx, jsonValue, this)
        );
        break;
      case maybeJsonObject(value):
        detectCircularReference(value);
        this.#kind = "object";
        this.#children = [];
        for (const [k, jsonValue] of Object.entries(value)) {
          if (typeof jsonValue !== "undefined") {
            this.#children.push(new JsonNode(k, jsonValue, this));
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

  get parent(): JsonNode<JsonValue> | null {
    return this.#parent;
  }

  get children(): Array<JsonNode<JsonValue>> | null {
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
        visitor.visitScalar(this as JsonNode<JsonScalar>);
        break;
      case "array":
        visitor.visitArray(this as JsonNode<JsonArray>);
        break;
      case "object":
        visitor.visitObject(this as JsonNode<JsonObject>);
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
