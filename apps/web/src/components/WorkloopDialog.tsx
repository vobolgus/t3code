import type { ThreadId } from "@t3tools/contracts";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";

interface WorkloopDialogProps {
  open: boolean;
  threadId: ThreadId;
  promptText: string;
  prompts: ReadonlyArray<string>;
  active: boolean;
  nextPromptIndex: number;
  disabled: boolean;
  canStart: boolean;
  statusLabel: string | null;
  onOpenChange: (open: boolean) => void;
  onPromptTextChange: (value: string) => void;
  onStart: () => void;
  onStop: () => void;
}

export default function WorkloopDialog(props: WorkloopDialogProps) {
  const nextPromptNumber =
    props.prompts.length > 0 ? Math.min(props.nextPromptIndex + 1, props.prompts.length) : 0;
  const promptCountByValue = new Map<string, number>();

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPopup className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Workloop</DialogTitle>
          <DialogDescription>
            One prompt per line. T3 Code will send them in order after each completed turn and loop
            back to the top. It will stop automatically when the assistant includes a standalone
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">WORKLOOP_EXIT</code>
            line in its reply.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="space-y-4">
          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor={`workloop-prompts-${props.threadId}`}>
              Prompt queue
            </label>
            <Textarea
              id={`workloop-prompts-${props.threadId}`}
              value={props.promptText}
              onChange={(event) => props.onPromptTextChange(event.currentTarget.value)}
              rows={8}
              placeholder={"Continue with the plan\nFind bugs and fix them\nPlan fully done? Exit if yes"}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={props.active ? "default" : "outline"}>
              {props.active ? "Active" : "Idle"}
            </Badge>
            <Badge variant="outline">
              {props.prompts.length === 0 ? "No prompts" : `${props.prompts.length} prompts`}
            </Badge>
            {props.active && props.prompts.length > 0 ? (
              <Badge variant="outline">Next: #{nextPromptNumber}</Badge>
            ) : null}
          </div>
          {props.statusLabel ? <p className="text-muted-foreground text-sm">{props.statusLabel}</p> : null}
          {props.prompts.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="font-medium text-sm">Execution order</p>
              <ol className="space-y-2 text-sm">
                {props.prompts.map((prompt, index) => {
                  const duplicateCount = (promptCountByValue.get(prompt) ?? 0) + 1;
                  promptCountByValue.set(prompt, duplicateCount);

                  return (
                    <li
                      key={`${prompt}:${duplicateCount}`}
                      className="rounded-lg border border-border/60 bg-background/80 px-3 py-2"
                    >
                      <span className="mr-2 text-muted-foreground/70 text-xs">{index + 1}.</span>
                      {prompt}
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}
        </DialogPanel>
        <DialogFooter variant="bare">
          {props.active ? (
            <Button variant="destructive" onClick={props.onStop}>
              Stop workloop
            </Button>
          ) : (
            <Button onClick={props.onStart} disabled={props.disabled || !props.canStart}>
              Start workloop
            </Button>
          )}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
