import { submitBallot } from "@/lib/actions/ballots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

type DebateForBallot = {
  id: string;
  teams: {
    id: string;
    teamId: string;
    position: string;
    points: number | null;
    team: {
      id: string;
      name: string;
      speakers: { id: string; name: string }[];
    };
  }[];
};

export function BallotForm({
  debate,
  adjudicatorId,
  redirectPath,
}: {
  debate: DebateForBallot;
  adjudicatorId: string;
  redirectPath: string;
}) {
  const action = submitBallot.bind(null, debate.id, adjudicatorId, redirectPath);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter result</CardTitle>
        <CardDescription>
          Record points for each team and scores for each speaker.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          {debate.teams.map((dt) => (
            <div key={dt.id} className="space-y-3 rounded-md border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{dt.team.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {dt.position}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`points-${dt.teamId}`} className="text-xs">
                    Points
                  </Label>
                  <Input
                    id={`points-${dt.teamId}`}
                    name={`points-${dt.teamId}`}
                    type="number"
                    step="1"
                    defaultValue={dt.points ?? undefined}
                    className="w-20"
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {dt.team.speakers.map((speaker) => (
                  <div
                    key={speaker.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <Label htmlFor={`score-${speaker.id}`} className="text-sm">
                      {speaker.name}
                    </Label>
                    <Input
                      id={`score-${speaker.id}`}
                      name={`score-${speaker.id}`}
                      type="number"
                      step="0.5"
                      className="w-24"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button type="submit">Submit result</Button>
        </form>
      </CardContent>
    </Card>
  );
}
