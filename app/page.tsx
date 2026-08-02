'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Sparkles, Clock, Trash2, Play, Shuffle, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandWordmark } from '@/components/brand-wordmark';
import { deleteDrawing, ensureSeeded, getLastOpen, listDrawings, promptOfTheDay } from '@/lib/studio/storage';
import { CANVAS_PRESETS, type Drawing } from '@/lib/studio/types';
import { randomColor } from '@/lib/studio/palettes';

export default function Dashboard() {
  const router = useRouter();
  const [drawings, setDrawings] = useState<Drawing[] | null>(null);
  const [prompt, setPrompt] = useState('');
  const [lastOpen, setLastOpen] = useState<string | null>(null);

  useEffect(() => {
    ensureSeeded();
    setDrawings(listDrawings());
    setPrompt(promptOfTheDay());
    setLastOpen(getLastOpen());
  }, []);

  const start = (width: number, height: number, label: string) => {
    const query = new URLSearchParams({
      width: String(width),
      height: String(height),
      label,
      accent: randomColor(),
    });
    router.push(`/draw/new?${query.toString()}`);
  };

  const resume = drawings?.find((d) => d.id === lastOpen);

  return (
    <main className='min-h-screen bg-background'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-[0.22] blur-3xl'
        style={{ background: 'var(--gradient-hero)' }}
      />

      <div className='relative mx-auto max-w-6xl px-4 pb-16 sm:px-5 sm:pb-24'>
        <nav className='flex items-center justify-between py-4 sm:py-6'>
          <div className='flex items-center gap-3'>
            <span className='grid size-14 place-items-center overflow-hidden rounded-2xl'>
              <Image
                src='/logo-mark.webp'
                alt='Vividraw logo'
                width={56}
                height={56}
                priority
                unoptimized
                className='size-14 object-contain'
              />
            </span>
            <BrandWordmark />
          </div>
          <Button
            onClick={() => start(1600, 900, 'Landscape')}
            aria-label='Create a new canvas'
            className='glow-primary size-10 px-0 font-display font-semibold sm:h-10 sm:w-auto sm:px-4'
          >
            <Plus className='size-4' /> <span className='hidden sm:inline'>New canvas</span>
          </Button>
        </nav>

        {/* hero */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className='pt-7 pb-10 sm:pt-10 sm:pb-14'
        >
          <span className='inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium text-muted-foreground'>
            <Sparkles className='size-3 text-lime' /> Canvas API · layers · replay
          </span>
          <h1 className='mt-5 max-w-3xl font-display text-[2.75rem] leading-[0.98] font-bold sm:text-7xl sm:leading-[1.02]'>
            Make something <span className='text-gradient'>loud</span> today.
          </h1>
          <p className='mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground sm:text-base'>
            A drawing studio built for fast ideas — expressive brushes, layered canvases, custom palettes and a replay
            that turns every sketch into a timelapse.
          </p>
          <div className='mt-7 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap'>
            <Button
              size='lg'
              onClick={() => start(1600, 900, 'Fresh')}
              className='glow-primary h-12 w-full font-display text-base font-semibold sm:w-auto'
            >
              <Plus className='size-4' /> Start a new canvas
            </Button>
            {resume && (
              <Button size='lg' variant='outline' className='h-12 w-full sm:w-auto' onClick={() => router.push(`/draw/${resume.id}`)}>
                <Play className='size-4' /> Resume “{resume.title}”
              </Button>
            )}
          </div>
        </motion.section>

        {/* presets + prompt */}
        <section className='grid gap-5 lg:grid-cols-[1.6fr_1fr]'>
          <div className='surface-panel rounded-2xl p-4 sm:rounded-3xl sm:p-5'>
            <h2 className='flex items-center gap-2 font-display text-sm font-semibold'>
              <Palette className='size-4 text-primary' /> Canvas presets
            </h2>
            <div className='mt-4 grid grid-cols-3 gap-2 sm:gap-3'>
              {CANVAS_PRESETS.map((preset, i) => (
                <motion.button
                  key={preset.id}
                  type='button'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                  whileHover={{ y: -3 }}
                  onClick={() => start(preset.width, preset.height, preset.label)}
                  className='group min-w-0 rounded-2xl border border-border bg-surface-2/50 p-2.5 text-left transition-colors hover:border-primary/60 sm:p-3'
                >
                  <div className='flex h-12 items-end justify-center sm:h-16'>
                    <div
                      className='rounded-md border border-foreground/20 bg-foreground/10 transition-colors group-hover:border-primary group-hover:bg-primary/20'
                      style={{
                        width: Math.min(56, (preset.width / preset.height) * 42),
                        height: Math.min(56, (preset.height / preset.width) * 42),
                      }}
                    />
                  </div>
                  <p className='mt-2 truncate text-[11px] font-semibold sm:text-xs'>{preset.label}</p>
                  <p className='truncate font-mono text-[9px] text-muted-foreground sm:text-[10px]'>{preset.hint}</p>
                </motion.button>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className='relative overflow-hidden rounded-2xl border border-border p-5 sm:rounded-3xl sm:p-6'
            style={{ background: 'var(--gradient-accent)' }}
          >
            <p className='text-[11px] font-semibold tracking-widest text-primary-foreground/80 uppercase'>
              Prompt of the day
            </p>
            <p className='mt-3 font-display text-2xl leading-snug font-semibold text-primary-foreground'>{prompt}</p>
            <Button variant='secondary' className='mt-6' onClick={() => start(1080, 1080, 'Prompt')}>
              <Shuffle className='size-4' /> Draw this
            </Button>
          </motion.div>
        </section>

        {/* recent */}
        <section className='mt-12'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='flex items-center gap-2 font-display text-lg font-semibold'>
              <Clock className='size-4 text-cyan' /> Recent drawings
            </h2>
            {drawings && drawings.length > 0 && (
              <span className='font-mono text-xs text-muted-foreground'>{drawings.length} saved locally</span>
            )}
          </div>

          {drawings === null ? (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {[0, 1, 2].map((i) => (
                <div key={i} className='h-52 animate-pulse rounded-3xl border border-border bg-surface' />
              ))}
            </div>
          ) : drawings.length === 0 ? (
            <EmptyState onCreate={() => start(1600, 900, 'First')} />
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <AnimatePresence mode='popLayout'>
                {drawings.map((d, i) => (
                  <motion.article
                    key={d.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ delay: 0.03 * i, type: 'spring', stiffness: 260, damping: 28 }}
                    whileHover={{ y: -5 }}
                    className='drawing-card group relative overflow-hidden rounded-3xl border border-border bg-surface'
                  >
                    <button
                      type='button'
                      onClick={() => router.push(`/draw/${d.id}`)}
                      className='block w-full text-left'
                    >
                      <div className='relative h-44 overflow-hidden bg-white'>
                        {d.thumbnail ? (
                          <img
                            src={d.thumbnail}
                            alt={`Preview of ${d.title}`}
                            loading='lazy'
                            className='size-full object-cover transition-transform duration-500 group-hover:scale-[1.06]'
                          />
                        ) : (
                          <div className='dot-grid size-full bg-surface-2' />
                        )}
                        <span className='absolute inset-x-0 bottom-0 h-1' style={{ backgroundColor: d.accent }} />
                      </div>
                      <div className='p-4'>
                        <h3 className='truncate font-display text-sm font-semibold'>{d.title}</h3>
                        <p className='mt-1 font-mono text-[11px] text-muted-foreground'>
                          {d.width}×{d.height} · {timeAgo(d.updatedAt)}
                        </p>
                      </div>
                    </button>
                    <button
                      type='button'
                      aria-label={`Delete ${d.title}`}
                      onClick={() => {
                        deleteDrawing(d.id);
                        setDrawings(listDrawings());
                      }}
                      className='drawing-delete absolute top-3 right-3 grid size-10 place-items-center rounded-xl border border-border bg-background/90 text-destructive shadow-lg backdrop-blur transition hover:bg-destructive hover:text-destructive-foreground'
                    >
                      <Trash2 className='size-4' />
                    </button>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className='dot-grid grid place-items-center rounded-3xl border border-dashed border-border py-20 text-center'
    >
      <div className='max-w-sm'>
        <div
          className='mx-auto grid size-14 place-items-center rounded-2xl'
          style={{ background: 'var(--gradient-hero)' }}
        >
          <Sparkles className='size-6 text-primary-foreground' />
        </div>
        <h3 className='mt-5 font-display text-xl font-semibold'>Your studio is empty</h3>
        <p className='mt-2 text-sm text-muted-foreground'>
          Nothing saved yet. Open a canvas, make a mess, and it will autosave right here.
        </p>
        <Button className='glow-primary mt-6' onClick={onCreate}>
          <Plus className='size-4' /> Create your first canvas
        </Button>
      </div>
    </motion.div>
  );
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
