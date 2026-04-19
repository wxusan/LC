'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { submitAssignmentAction } from '@/lib/data/submissions';

interface Props {
  assignmentId: string;
  classId: string;
  initialText: string;
  initialFileUrl: string;
  locked: boolean;
}

export function SubmitForm({ assignmentId, initialText, initialFileUrl, locked }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState(initialText);
  const [fileUrl, setFileUrl] = useState(initialFileUrl);

  if (locked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {initialText && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>Your answer</div>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                fontSize: 13,
                background: 'var(--muted)',
                padding: 10,
                borderRadius: 'var(--radius-sm)',
                lineHeight: 1.55,
              }}
            >
              {initialText}
            </div>
          </div>
        )}
        {initialFileUrl && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>Your file</div>
            <a
              href={initialFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: 'var(--primary)' }}
            >
              {initialFileUrl} ↗
            </a>
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
          This submission has been graded and can no longer be edited.
        </div>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim() && !fileUrl.trim()) {
      toast.push('Write an answer or attach a file', 'warning');
      return;
    }
    const form = e.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const res = await submitAssignmentAction(data);
      if (!res.ok) toast.push(res.error, 'error');
      else {
        toast.push('Submitted', 'success');
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted-foreground)' }}>
        Your answer
      </label>
      <textarea
        name="text_answer"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="Type your response..."
        style={{
          fontFamily: 'inherit',
          fontSize: 13,
          padding: 10,
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--background)',
          color: 'var(--foreground)',
          resize: 'vertical',
          minHeight: 140,
          lineHeight: 1.55,
        }}
      />
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted-foreground)', marginTop: 4 }}>
        Or a link to your file (Google Drive, Dropbox…)
      </label>
      <Input
        name="file_url"
        type="url"
        placeholder="https://…"
        value={fileUrl}
        onChange={(e) => setFileUrl(e.target.value)}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? 'Submitting…' : initialText || initialFileUrl ? 'Update submission' : 'Submit'}
        </Button>
      </div>
    </form>
  );
}
