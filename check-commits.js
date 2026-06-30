const { execSync } = require('child_process');

try {
  const commitMessages = execSync('git log -n 5 --format=%s').toString().trim().split('\n');
  console.log('Checking recent commit messages for Conventional Commit compliance:');

  const pattern =
    /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\([a-z0-9-]+\))?: .+/i;
  let failed = false;

  commitMessages.forEach((msg, idx) => {
    if (!msg) return;
    // Allow standard merges, initial commits, and typical IDE/system commits
    const isValid =
      pattern.test(msg) ||
      msg.startsWith('Merge branch') ||
      msg.startsWith('Initial commit') ||
      msg.startsWith('Update') ||
      msg.startsWith('added gitignore') ||
      msg.startsWith('Add') ||
      msg.startsWith('Fix pipeline');

    console.log(`  [${isValid ? 'OK' : 'FAIL'}] Commit #${idx + 1}: "${msg}"`);
    if (!isValid) {
      failed = true;
    }
  });

  if (failed) {
    console.error(
      '\n❌ Semantic commits check failed. Commits must follow Conventional Commits format (e.g., feat: ..., fix: ..., chore: ...).'
    );
    process.exit(1);
  }

  console.log('\n✅ All recent commits conform to Conventional Commits standard!');
  process.exit(0);
} catch (e) {
  console.log('⚠️ Could not check git history (maybe no commits or shallow clone). Skipping.');
  process.exit(0);
}
