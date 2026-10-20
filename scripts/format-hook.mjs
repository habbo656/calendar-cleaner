// Claude Code PostToolUse hook: formats the file that was just edited with Prettier,
// so agents never fail CI on formatting. Reads the hook payload from stdin.
import { execFileSync } from 'node:child_process';

let input = '';
for await (const chunk of process.stdin) input += chunk;

const file = JSON.parse(input || '{}').tool_input?.file_path;
if (file) {
  try {
    execFileSync(
      'npx',
      ['prettier', '--write', '--ignore-unknown', '--log-level', 'silent', file],
      {
        stdio: 'ignore',
      },
    );
  } catch {
    // Formatting is best-effort; CI's format:check is the real gate.
  }
}
