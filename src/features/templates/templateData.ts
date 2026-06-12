import type { SystemEdge, SystemNode } from '@/types';
import { createSystemNode } from '@/features/nodes/nodeFactory';
import { createEdgeFromConnection } from '@/features/edges/edgeFactory';
import type { Connection } from 'reactflow';

export interface Template {
  id: string;
  label: string;
  description: string;
  build: () => { nodes: SystemNode[]; edges: SystemEdge[] };
}

function edge(src: string, tgt: string, label?: string): SystemEdge {
  const e = createEdgeFromConnection({
    source: src,
    target: tgt,
    sourceHandle: 'right',
    targetHandle: 'left',
  } as Connection)!;
  if (label) e.data = { ...e.data, label };
  return e;
}

function node(
  kind: Parameters<typeof createSystemNode>[0],
  x: number,
  y: number,
  title?: string,
): SystemNode {
  return createSystemNode(kind, { x, y }, title ? { title } : {});
}

const urlShortener: Template = {
  id: 'url-shortener',
  label: 'URL Shortener',
  description: 'Classic interview problem — encode/decode + analytics',
  build: () => {
    const client = node('client', 0, 150);
    const lb = node('load-balancer', 260, 150);
    const api = node('microservice', 520, 80, 'Shortener API');
    const redis = node('cache', 520, 260, 'Redis (counter)');
    const db = node('database-sql', 780, 80, 'PostgreSQL');
    const analytics = node('analytics', 780, 260, 'Analytics DWH');
    const nodes = [client, lb, api, redis, db, analytics];
    const edges = [
      edge(client.id, lb.id, 'HTTP'),
      edge(lb.id, api.id),
      edge(api.id, redis.id, 'ID gen'),
      edge(api.id, db.id, 'store mapping'),
      edge(api.id, analytics.id, 'click event'),
    ];
    return { nodes, edges };
  },
};

const newsFeed: Template = {
  id: 'news-feed',
  label: 'News Feed',
  description: 'Fan-out on write with ranking',
  build: () => {
    const client = node('client', 0, 200);
    const lb = node('load-balancer', 250, 200);
    const post = node('microservice', 500, 100, 'Post Service');
    const fan = node('queue', 500, 300, 'Fan-out Queue');
    const feed = node('microservice', 750, 300, 'Feed Generator');
    const cache = node('cache', 1000, 200, 'Feed Cache');
    const db = node('database-nosql', 750, 100, 'Posts DB');
    const nodes = [client, lb, post, fan, feed, cache, db];
    const edges = [
      edge(client.id, lb.id),
      edge(lb.id, post.id, 'create'),
      edge(post.id, db.id, 'persist'),
      edge(post.id, fan.id, 'async'),
      edge(fan.id, feed.id),
      edge(feed.id, cache.id, 'rank & cache'),
    ];
    return { nodes, edges };
  },
};

const chat: Template = {
  id: 'chat-system',
  label: 'Chat System',
  description: 'Real-time messaging with presence',
  build: () => {
    const client = node('client', 0, 150);
    const ws = node('websocket', 250, 150, 'WS Gateway');
    const chat = node('microservice', 500, 80, 'Chat Service');
    const presence = node('microservice', 500, 250, 'Presence Service');
    const queue = node('queue', 750, 80, 'Message Queue');
    const db = node('database-nosql', 950, 80, 'Messages DB');
    const cache = node('cache', 750, 250, 'Online Cache');
    const notif = node('notification', 950, 250, 'Push Notifications');
    const nodes = [client, ws, chat, presence, queue, db, cache, notif];
    const edges = [
      edge(client.id, ws.id, 'WS'),
      edge(ws.id, chat.id),
      edge(ws.id, presence.id),
      edge(chat.id, queue.id, 'fan-out'),
      edge(queue.id, db.id, 'persist'),
      edge(presence.id, cache.id),
      edge(queue.id, notif.id, 'offline notify'),
    ];
    return { nodes, edges };
  },
};

const ridesharing: Template = {
  id: 'ride-sharing',
  label: 'Ride Sharing',
  description: 'Location matching + dispatch',
  build: () => {
    const rider = node('client', 0, 80, 'Rider App');
    const driver = node('client', 0, 280, 'Driver App');
    const gateway = node('api-gateway', 250, 180);
    const match = node('microservice', 500, 80, 'Matching Service');
    const location = node('cache', 500, 280, 'Location (Redis Geo)');
    const trips = node('database-sql', 750, 80, 'Trips DB');
    const payment = node('payment', 750, 280, 'Payment');
    const notif = node('notification', 950, 180);
    const nodes = [rider, driver, gateway, match, location, trips, payment, notif];
    const edges = [
      edge(rider.id, gateway.id),
      edge(driver.id, gateway.id, 'location pings'),
      edge(gateway.id, match.id),
      edge(gateway.id, location.id, 'geo update'),
      edge(match.id, location.id, 'nearest N'),
      edge(match.id, trips.id, 'create trip'),
      edge(match.id, payment.id, 'charge'),
      edge(match.id, notif.id, 'notify both'),
    ];
    return { nodes, edges };
  },
};

const videoStreaming: Template = {
  id: 'video-streaming',
  label: 'Video Streaming',
  description: 'Upload, transcode, deliver via CDN',
  build: () => {
    const uploader = node('client', 0, 150, 'Uploader');
    const api = node('api-gateway', 250, 150);
    const storage = node('object-storage', 500, 60, 'Raw Bucket');
    const transcode = node('scheduler', 500, 260, 'Transcoder');
    const cdn = node('cdn', 750, 60);
    const meta = node('database-sql', 750, 260, 'Video Metadata DB');
    const search = node('search', 950, 260, 'Search Index');
    const viewer = node('client', 950, 60, 'Viewer');
    const nodes = [uploader, api, storage, transcode, cdn, meta, search, viewer];
    const edges = [
      edge(uploader.id, api.id, 'upload'),
      edge(api.id, storage.id, 'raw file'),
      edge(storage.id, transcode.id, 'trigger'),
      edge(transcode.id, cdn.id, 'push HLS'),
      edge(transcode.id, meta.id, 'persist metadata'),
      edge(meta.id, search.id, 'index'),
      edge(cdn.id, viewer.id, 'stream'),
    ];
    return { nodes, edges };
  },
};

export const TEMPLATES: Template[] = [
  urlShortener,
  newsFeed,
  chat,
  ridesharing,
  videoStreaming,
];
