# Setapp Hash Load-balancing demo

Demo application for my Setapp presentation in Poznan on 26.04.2023.

[Presentation link](https://docs.google.com/presentation/d/11mcWu-8RKfx6iHt5S543qfmvfukUJVp50vrOGQe3HJc/edit?usp=sharing)

## Building

```
npm install
npm build
```

## Running

```
npm run start -- worker_tag_1 worker_tag_2
```

## Changing jobs

Modify the `jobs.json` by adding or removing strings from the array.

## Resetting workers

Replace whole `workers.json` with empty object (`{}`).

## Using different load-balancing methods

Uncomment one of imports in `jobManager.ts` and rebuild the app:

```typescript
// import { isMyJob } from './distributedHashing';
// import { isMyJob } from './consistentHashing';
import { isMyJob } from './rendezvousHashing';
```

# Contact

Sebastian Alex

sebastian.alex@precate.pl

[Linked.in](https://www.linkedin.com/in/sebastian-alex/)

Have fun!
