import { useAuth } from "@/contexts/AuthContext";
import { Participant } from "@/types/trip";

/**
 * Returns the participant ID of the currently logged-in user
 * from a list of trip participants, or falls back to the first participant.
 */
export function useCurrentParticipantId(participants: Participant[]): string {
  const { user } = useAuth();
  if (!user || participants.length === 0) return participants[0]?.id || "";

  const match = participants.find((p) => p.userId === user.id);
  return match?.id || participants[0]?.id || "";
}
