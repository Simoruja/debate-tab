import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="mb-8 h-8 w-72" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-4 h-80 w-full" />
    </div>
  );
}
