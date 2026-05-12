import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiError } from "@/lib/api/client";

export function ErrorBlock({
  error,
  title = "Something went wrong",
}: {
  error: unknown;
  title?: string;
}) {
  let message = "Unknown error";
  let status: number | undefined;
  if (error instanceof ApiError) {
    message = error.message;
    status = error.status;
  } else if (error instanceof Error) {
    message = error.message;
  }
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {title}
        {status ? ` (${status})` : ""}
      </AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
