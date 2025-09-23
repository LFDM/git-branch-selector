#!/usr/bin/env node
import { execSync } from "child_process";
import inquirer from "inquirer";

function runGitBranches(): string {
  const output = execSync("git branch -v --sort=-committerdate", {
    stdio: ["ignore", "pipe", "pipe"],
  });
  return output.toString("utf8");
}

type BranchInfo = {
  raw: string;
  name: string;
  sha: string;
  message: string;
  current: boolean;
};

function parseBranches(raw: string): BranchInfo[] {
  return raw
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map((line) => {
      // Example lines:
      // * main  1a2b3c4d Commit message here
      //   feature/foo  a1b2c3d4 Another message
      const isCurrent = line.startsWith("*");
      const withoutMarker = isCurrent
        ? line.slice(1).trimStart()
        : line.trimStart();
      const parts = withoutMarker.split(/\s+/);
      const name = parts[0] ?? "";
      const sha = parts[1] ?? "";
      const message = parts.slice(2).join(" ");
      return {
        raw: line,
        name,
        sha,
        message,
        current: isCurrent,
      } as BranchInfo;
    });
}

async function main(): Promise<void> {
  const raw = runGitBranches();
  const branches = parseBranches(raw);

  const terminalWidth = process.stdout.columns ?? 100;
  const computedBranchWidth = Math.max(
    10,
    Math.min(
      40,
      branches.reduce((max, b) => Math.max(max, b.name.length), 0)
    )
  );
  const shaWidth = Math.min(
    12,
    Math.max(
      7,
      branches.reduce((max, b) => Math.max(max, b.sha.length), 0)
    )
  );
  const fixedOverhead =
    1 /* marker */ +
    1 /* space */ +
    computedBranchWidth +
    2 /* spaces */ +
    shaWidth +
    1; /* space */
  const remainingForMessage = Math.max(20, terminalWidth - fixedOverhead);

  function truncate(value: string, width: number): string {
    if (value.length <= width) return value;
    if (width <= 1) return value.slice(0, width);
    return value.slice(0, width - 1) + "…";
  }

  const choices = branches.map((b) => {
    const marker = b.current ? "*" : " ";
    const nameCol = truncate(b.name, computedBranchWidth).padEnd(
      computedBranchWidth,
      " "
    );
    const shaCol = truncate(b.sha, shaWidth).padEnd(shaWidth, " ");
    const msgCol = truncate(b.message, remainingForMessage);
    return {
      name: `${marker} ${nameCol}  ${shaCol} ${msgCol}`,
      value: b.name,
    };
  });

  const { selected } = await inquirer.prompt<{ selected: string }>([
    {
      type: "list",
      name: "selected",
      message: "Select a branch to checkout:",
      pageSize: 20,
      choices,
    },
  ]);

  execSync(`git checkout ${selected}`, { stdio: "inherit" });
}

main();
