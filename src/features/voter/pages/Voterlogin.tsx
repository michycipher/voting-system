import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { KeyRound, ArrowRight, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  uniqueCode: z.string().min(8, 'Code must be 8 characters').max(8, 'Code must be 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function VoterLogin() {
  const navigate = useNavigate();
  const [voterCode, setVoterCode] = useState<string | null>(null);
  
  const voter = useQuery(
    api.voters.getByCode,
    voterCode ? { uniqueCode: voterCode } : 'skip'
  );

  const votingEnabled = useQuery(api.settings.get, { key: 'votingEnabled' });
  const electionTitle = useQuery(api.settings.get, { key: 'electionTitle' });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    setVoterCode(data.uniqueCode.toUpperCase());
  };

  // Handle voter verification
  if (voterCode && voter !== undefined) {
    if (!voter) {
      toast.error('Invalid voting code. Please check and try again.');
      setVoterCode(null);
      return null;
    }

    if (voter.hasVoted) {
      toast.error('You have already cast your vote.');
      setVoterCode(null);
      return null;
    }

    if (!votingEnabled?.value) {
      toast.error('Voting is currently closed.');
      setVoterCode(null);
      return null;
    }

    // Store voter info and navigate
    sessionStorage.setItem('voterCode', voter.uniqueCode);
    sessionStorage.setItem('voterName', `${voter.firstName} ${voter.surname}`);
    navigate('/vote');
  }

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <div className="card">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
            {electionTitle?.value || 'Election Voting'}
          </h2>
          <p className="text-gray-600">
            Enter your unique voting code to cast your vote
          </p>
        </div>

        {!votingEnabled?.value && (
          <div className="mb-6 p-4 bg-secondary/10 border border-secondary/20 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-secondary">Voting is Currently Closed</p>
              <p className="text-xs text-gray-600 mt-1">
                Please check back when voting opens.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="uniqueCode" className="label">
              Voting Code
            </label>
            <input
              id="uniqueCode"
              type="text"
              placeholder="Enter 8-character code"
              className="input uppercase"
              maxLength={8}
              disabled={!votingEnabled?.value}
              {...register('uniqueCode')}
            />
            {errors.uniqueCode && (
              <p className="text-sm text-secondary mt-1">{errors.uniqueCode.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!votingEnabled?.value}
            className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Continue to Vote</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Don't have a voting code? Contact your election administrator.
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <a
          href="/admin/login"
          className="text-sm text-primary hover:text-primary-dark transition-colors"
        >
          Admin Login
        </a>
      </div>
    </div>
  );
}