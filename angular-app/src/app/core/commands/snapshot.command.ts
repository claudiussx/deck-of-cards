import { Command } from './command';
import { DeckService } from '../services/deck.service';

/** Captures before/after snapshots around any DeckService action. */
export class SnapshotCommand implements Command {
  private before: { deck: any[]; drawn: any[] };
  private after:  { deck: any[]; drawn: any[] };

  constructor(
    private service: DeckService,
    private action: () => void
  ) {
    // 1) capture state before
    this.before = {
      deck:  [...(service as any).deckSubject.value],
      drawn: [...(service as any).drawnSubject.value],
    };
    // 2) perform the action
    this.action();
    // 3) capture state after
    this.after = {
      deck:  [...(service as any).deckSubject.value],
      drawn: [...(service as any).drawnSubject.value],
    };
  }

  execute(): void {
    this.service.restore(this.after);
  }

  undo(): void {
    this.service.restore(this.before);
  }
}
