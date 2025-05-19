declare class ConfluentSchemaRegistryError extends Error {
    constructor(error: any);
}
declare class ConfluentSchemaRegistryArgumentError extends ConfluentSchemaRegistryError {
}
declare class ConfluentSchemaRegistryCompatibilityError extends ConfluentSchemaRegistryError {
}
export { ConfluentSchemaRegistryError, ConfluentSchemaRegistryArgumentError, ConfluentSchemaRegistryCompatibilityError, };
