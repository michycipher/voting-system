import { Id } from '../../convex/_generated/dataModel';

export interface Candidate {
  _id: Id<'candidates'>;
  title: string;
  firstName: string;
  middleName?: string;
  surname: string;
  position: string;
  imageUrl?: string;
  biography?: string;
  voteCount: number;
  createdAt: number;
}

export interface Voter {
  _id: Id<'voters'>;
  uniqueCode: string;
  title: string;
  firstName: string;
  middleName?: string;
  surname: string;
  gender: string;
  hasVoted: boolean;
  votedAt?: number;
  createdAt: number;
}

export interface Vote {
  _id: Id<'votes'>;
  voterCode: string;
  candidateId: Id<'candidates'>;
  candidateName: string;
  position: string;
  timestamp: number;
  voterName: string;
}

export interface Setting {
  _id: Id<'settings'>;
  key: string;
  value: any;
  updatedAt: number;
}

export interface AuditLog {
  _id: Id<'auditLogs'>;
  action: string;
  performedBy: string;
  details: string;
  timestamp: number;
  category: 'voter' | 'candidate' | 'vote' | 'system';
}

export interface VoteSelection {
  position: string;
  candidateId: Id<'candidates'>;
  candidateName: string;
}

export interface PositionResult {
  position: string;
  candidates: {
    id: Id<'candidates'>;
    name: string;
    voteCount: number;
    percentage: number;
    imageUrl?: string;
  }[];
  totalVotes: number;
}