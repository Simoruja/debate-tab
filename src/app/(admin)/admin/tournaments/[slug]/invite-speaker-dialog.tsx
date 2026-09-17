"use client";

import { useActionState, useState } from "react";
import { inviteSpeaker } from "@/lib/actions/participants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export function InviteSpeakerDialog({
  slug,
  speakerId,
  speakerName,
}: {
  slug: string;
  speakerId: string;
  speakerName: string;
}) {
  const [open, setOpen] = useState(false);
  const action = inviteSpeaker.bind(null, slug, speakerId);
  const [error, formAction, pending] = useActionState(action, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create login for {speakerName}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`email-${speakerId}`}>Email</Label>
            <Input id={`email-${speakerId}`} name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`password-${speakerId}`}>Temporary password</Label>
            <Input
              id={`password-${speakerId}`}
              name="password"
              type="text"
              minLength={6}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create login"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
