# Security model

Loom reads source and Git metadata inside the selected repository. It does not
send source to a network service, require credentials, or execute package
scripts during `scan`, `impact`, `graph`, `report`, `explain`, `doctor`, or
`ci`.

- Git arguments are passed as argument arrays, not interpolated shell commands.
- Repository-relative paths are validated before reads and writes.
- Output cannot escape the repository root.
- Configuration is strict JSON and never evaluated as code.
- Source paths are reported relative to the repository; absolute paths are not
  serialized.
- The optional dashboard only renders validated report data.
- AI investigation and patch application are not enabled in this release.

Do not mount untrusted repositories into a privileged container without adding
the operating-system restrictions appropriate for your environment. Loom is a
developer tool, not a complete sandbox.
