import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload } from "lucide-react";

export default function QuizCreate() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/quizzes")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Quizzes
      </Button>

      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center space-y-3">
          <Upload className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <h2 className="text-lg font-semibold">Create a Quiz</h2>
          <p className="text-sm text-muted-foreground">
            Go to <strong>Study Materials</strong>, upload content, and click <strong>"Generate Quiz"</strong> to create a quiz automatically.
          </p>
          <Button onClick={() => navigate("/materials")} className="mt-2">
            Go to Materials
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
