#!/usr/bin/env node
import { execSync } from "child_process";
import inquirer from "inquirer";

function runGitBranches(): string {
  const output = execSync("git branch -v --sort=committerdate", {
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

  const choices = branches.map((b) => ({
    name: `${b.current ? "*" : " "} ${b.name}  ${b.sha} ${b.message}`,
    value: b.name,
  }));

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
