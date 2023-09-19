# Obsidian Repetitive Tasks

A plugin to allow the definition of repetitive tasks

## Usage

Define a task with a count number by including a #{count} in the task name.
For example:

```markdown
- [ ] Task 1 #3 
```

By pressing the check box button the task will not complete but increase the count by one.

```markdown
- [ ] Task 1 #3 (No Click)
- [1] Task 1 #3 (First Click)
- [2] Task 1 #3 (Second Click)
- [x] Task 1 #3 (Third Click)
```

The task will be completed after the count reaches the defined number.

## Limitations

Due to markdown restrictions only a single digit number can be used for the count. Limiting the count to the range 1 - 9.
Some Themes may not display the count inside the checkbox correctly.

### Working Themes

- Obsidian Default
- Obsidian Minimal
- Tokio Night
- Things
- Catppuccin
