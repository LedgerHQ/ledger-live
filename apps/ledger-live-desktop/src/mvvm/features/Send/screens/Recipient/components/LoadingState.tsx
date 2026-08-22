import React from "react";
import { Card, CardContent, CardHeader, CardLeading, Skeleton } from "@ledgerhq/lumen-ui-react";

export function LoadingState() {
  return (
    <div className="-mt-8 mb-12 flex w-full min-w-0 flex-col">
      <Card data-testid="send-loading-spinner">
        <CardHeader>
          <CardLeading>
            <Skeleton className="size-48 shrink-0 rounded-full" />
            <CardContent>
              {/* Wrapper heights mirror the title and description line-heights of RecipientCard */}
              <div className="flex h-20 items-center">
                <Skeleton className="h-12 w-176 rounded-full" />
              </div>
              <div className="flex h-16 items-center">
                <Skeleton className="h-12 w-112 rounded-full" />
              </div>
            </CardContent>
          </CardLeading>
        </CardHeader>

        <div className="flex gap-8 px-16 pb-16">
          <Skeleton className="h-40 flex-1 rounded-full" />
          <Skeleton className="h-40 flex-1 rounded-full" />
        </div>
      </Card>
    </div>
  );
}
