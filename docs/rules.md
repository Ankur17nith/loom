# Analysis rules

## `removed-field`

An exported interface or object-shaped type has a field in the base snapshot
that is absent in the working tree. A finding is emitted when a consumer still
reads the old field.

## `renamed-field`

When one field disappears and another field with the same normalized type and
optional status is added, Loom records a rename hypothesis. The report still
explains that this is an inference; field-name similarity alone is not proof of
semantic identity.

## `added-required-field`

A newly required field is recorded as a medium-severity potential break when
reachable consumers use the contract. The current slice does not claim to
prove every object construction site.

## `added-optional-field`

Optional additions are recorded as contract evolution but do not create a
breaking-consumer finding by default.

Every rule includes the declaration location, consumer location, relationship
path, confidence, and uncertainty where applicable.
