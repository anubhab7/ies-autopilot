import { SearchX } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { ButtonLink } from './ui';

export function NotFoundInline({ what, id, backTo, backLabel }: { what: string; id: string; backTo: string; backLabel: string }) {
  return (
    <div data-testid="not-found-inline">
      <h1 className="sr-only">{what} not found</h1>
      <EmptyState
        icon={SearchX}
        title={`No ${what.toLowerCase()} called "${id}"`}
        description={`It may have been removed, or the link has a typo. Go back to see what is available.`}
        action={
          <ButtonLink to={backTo} variant="primary">
            {backLabel}
          </ButtonLink>
        }
      />
    </div>
  );
}
