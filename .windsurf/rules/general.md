---
trigger: always_on
---

Follow these rules at ALL times:

1. NEVER use terminalDataWriteEvent (it is deprecated)
2. ALWAYS keep state in the state.js object
3. ALWAYS pass the state object into other files so they can modify it directly
