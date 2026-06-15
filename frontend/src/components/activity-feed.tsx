"use client";

import { formatDistanceToNow } from "date-fns";
import { Globe, Monitor } from "lucide-react";
import { UAParser } from "ua-parser-js";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EventFeedItem } from "@/lib/analytics";

interface ActivityFeedProps {
  events: EventFeedItem[];
}

function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) {
    return "Unknown";
  }

  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser().name ?? "Unknown browser";
  const os = parser.getOS().name ?? "Unknown OS";
  return `${browser} on ${os}`;
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Activity Feed</CardTitle>
        <CardDescription>
          Real-time open and click events captured from tracking pixels and redirect links.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <Globe className="h-8 w-8" />
            <p className="text-sm">No tracking events yet. Send a campaign to see activity here.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Client</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event, index) => (
                <TableRow key={`${event.timestamp}-${event.recipient}-${index}`}>
                  <TableCell className="font-medium">{event.recipient}</TableCell>
                  <TableCell>
                    <Badge variant={event.event_type === "open" ? "open" : "click"}>
                      {event.event_type === "open" ? "Open" : "Click"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span>{parseUserAgent(event.user_agent)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
