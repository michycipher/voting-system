import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import toast from 'react-hot-toast';
import { Check, User, ChevronRight, Loader } from 'lucide-react';
import { Candidate } from '@/types';

export default function VotingPage() {
  const navigate = useNavigate();
  const [selectedCandidates, setSelectedCandidates] = useState<Map<string, Id<'candidates'>>>(
    new Map()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const voterCode = sessionStorage.getItem('voterCode');
  const voterName = sessionStorage.getItem('voterName');

  const candidates = useQuery(api.candidates.list);
  const positions = useQuery(api.candidates.getPositions);
  const castVotes = useMutation(api.votes.castVotes);

  useEffect(() => {
    if (!voterCode) {
      toast.error('Please log in first');
      navigate('/');
    }
  }, [voterCode, navigate]);

  if (!candidates || !positions) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSelectCandidate = (position: string, candidateId: Id<'candidates'>) => {
    const newSelection = new Map(selectedCandidates);
    
    if (newSelection.get(position) === candidateId) {
      newSelection.delete(position);
    } else {
      newSelection.set(position, candidateId);
    }
    
    setSelectedCandidates(newSelection);
  };

  const handleSubmitVotes = async () => {
    if (selectedCandidates.size === 0) {
      toast.error('Please select at least one candidate');
      return;
    }

    if (selectedCandidates.size < positions.length) {
      const confirm = window.confirm(
        `You have only selected ${selectedCandidates.size} out of ${positions.length} positions. Do you want to continue?`
      );
      if (!confirm) return;
    }

    setIsSubmitting(true);

    try {
      // Prepare votes array
      const votesArray = Array.from(selectedCandidates.entries()).map(([position, candidateId]) => ({
        candidateId,
        position,
      }));

      // Submit all votes in a single mutation
      await castVotes({
        voterCode: voterCode!,
        votes: votesArray,
      });

      toast.success('Your votes have been recorded!');
      sessionStorage.setItem('votedPositions', JSON.stringify(Array.from(selectedCandidates.keys())));
      navigate('/confirmation');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit votes';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCandidatesByPosition = (position: string): Candidate[] => {
    return candidates.filter((c) => c.position === position);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Cast Your Vote</h2>
            <p className="text-gray-600 mt-1">Welcome, {voterName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Selected</p>
            <p className="text-2xl font-bold text-primary">
              {selectedCandidates.size} / {positions.length}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900 font-medium">
          Select one candidate for each position. You can change your selection before submitting.
        </p>
      </div>

      {/* Positions and Candidates */}
      <div className="space-y-8">
        {positions.map((position) => {
          const positionCandidates = getCandidatesByPosition(position);
          const selectedId = selectedCandidates.get(position);

          return (
            <div key={position} className="card">
              <h3 className="text-xl font-display font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                {position}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {positionCandidates.map((candidate) => {
                  const isSelected = selectedId === candidate._id;

                  return (
                    <button
                      key={candidate._id}
                      onClick={() => handleSelectCandidate(position, candidate._id)}
                      className={`candidate-card text-left relative ${
                        isSelected ? 'selected' : ''
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}

                      <div className="flex items-start space-x-4">
                        {candidate.imageUrl ? (
                          <img
                            src={candidate.imageUrl}
                            alt={`${candidate.firstName} ${candidate.surname}`}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-400" />
                          </div>
                        )}

                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {candidate.title} {candidate.firstName}{' '}
                            {candidate.middleName && `${candidate.middleName} `}
                            {candidate.surname}
                          </h4>
                          {candidate.biography && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {candidate.biography}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="mt-8 card bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Ready to submit your votes?</p>
            <p className="text-sm text-gray-600 mt-1">
              You have selected {selectedCandidates.size} candidate(s)
            </p>
          </div>
          <button
            onClick={handleSubmitVotes}
            disabled={isSubmitting || selectedCandidates.size === 0}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>Submit Votes</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}



// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useQuery, useMutation } from 'convex/react';
// import { api } from '../../../../convex/_generated/api';
// import { Id } from '../../../../convex/_generated/dataModel';
// import toast from 'react-hot-toast';
// import { Check, User, ChevronRight, Loader } from 'lucide-react';
// import { Candidate } from '@/types';

// export default function VotingPage() {
//   const navigate = useNavigate();
//   const [selectedCandidates, setSelectedCandidates] = useState<Map<string, Id<'candidates'>>>(
//     new Map()
//   );
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const voterCode = sessionStorage.getItem('voterCode');
//   const voterName = sessionStorage.getItem('voterName');

//   const candidates = useQuery(api.candidates.list);
//   const positions = useQuery(api.candidates.getPositions);
//   const castVote = useMutation(api.votes.castVote);

//   useEffect(() => {
//     if (!voterCode) {
//       toast.error('Please log in first');
//       navigate('/');
//     }
//   }, [voterCode, navigate]);

//   if (!candidates || !positions) {
//     return (
//       <div className="flex items-center justify-center min-h-100">
//         <Loader className="w-8 h-8 animate-spin text-primary" />
//       </div>
//     );
//   }

//   const handleSelectCandidate = (position: string, candidateId: Id<'candidates'>) => {
//     const newSelection = new Map(selectedCandidates);
    
//     if (newSelection.get(position) === candidateId) {
//       newSelection.delete(position);
//     } else {
//       newSelection.set(position, candidateId);
//     }
    
//     setSelectedCandidates(newSelection);
//   };

//   const handleSubmitVotes = async () => {
//     if (selectedCandidates.size === 0) {
//       toast.error('Please select at least one candidate');
//       return;
//     }

//     if (selectedCandidates.size < positions.length) {
//       const confirm = window.confirm(
//         `You have only selected ${selectedCandidates.size} out of ${positions.length} positions. Do you want to continue?`
//       );
//       if (!confirm) return;
//     }

//     setIsSubmitting(true);

//     try {
//       // Submit all votes
//       for (const [, candidateId] of selectedCandidates) {
//         await castVote({
//           voterCode: voterCode!,
//           candidateId,
//         });
//       }

//       toast.success('Your votes have been recorded!');
//       sessionStorage.setItem('votedPositions', JSON.stringify(Array.from(selectedCandidates.keys())));
//       navigate('/confirmation');
//     } catch (error) {
//       const message = error instanceof Error ? error.message : 'Failed to submit votes';
//       toast.error(message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const getCandidatesByPosition = (position: string): Candidate[] => {
//     return candidates.filter((c) => c.position === position);
//   };

//   return (
//     <div className="max-w-4xl mx-auto animate-fade-in">
//       {/* Header */}
//       <div className="card mb-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h2 className="text-2xl font-display font-bold text-gray-900">Cast Your Vote</h2>
//             <p className="text-gray-600 mt-1">Welcome, {voterName}</p>
//           </div>
//           <div className="text-right">
//             <p className="text-sm text-gray-600">Selected</p>
//             <p className="text-2xl font-bold text-primary">
//               {selectedCandidates.size} / {positions.length}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Instructions */}
//       <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
//         <p className="text-sm text-blue-900 font-medium">
//           Select one candidate for each position. You can change your selection before submitting.
//         </p>
//       </div>

//       {/* Positions and Candidates */}
//       <div className="space-y-8">
//         {positions.map((position) => {
//           const positionCandidates = getCandidatesByPosition(position);
//           const selectedId = selectedCandidates.get(position);

//           return (
//             <div key={position} className="card">
//               <h3 className="text-xl font-display font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
//                 {position}
//               </h3>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {positionCandidates.map((candidate) => {
//                   const isSelected = selectedId === candidate._id;

//                   return (
//                     <button
//                       key={candidate._id}
//                       onClick={() => handleSelectCandidate(position, candidate._id)}
//                       className={`candidate-card text-left relative ${
//                         isSelected ? 'selected' : ''
//                       }`}
//                     >
//                       {isSelected && (
//                         <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
//                           <Check className="w-4 h-4 text-white" />
//                         </div>
//                       )}

//                       <div className="flex items-start space-x-4">
//                         {candidate.imageUrl ? (
//                           <img
//                             src={candidate.imageUrl}
//                             alt={`${candidate.firstName} ${candidate.surname}`}
//                             className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
//                           />
//                         ) : (
//                           <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
//                             <User className="w-8 h-8 text-gray-400" />
//                           </div>
//                         )}

//                         <div className="flex-1">
//                           <h4 className="font-semibold text-gray-900">
//                             {candidate.title} {candidate.firstName}{' '}
//                             {candidate.middleName && `${candidate.middleName} `}
//                             {candidate.surname}
//                           </h4>
//                           {candidate.biography && (
//                             <p className="text-sm text-gray-600 mt-1 line-clamp-2">
//                               {candidate.biography}
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Submit Button */}
//       <div className="mt-8 card bg-gray-50">
//         <div className="flex items-center justify-between">
//           <div>
//             <p className="font-medium text-gray-900">Ready to submit your votes?</p>
//             <p className="text-sm text-gray-600 mt-1">
//               You have selected {selectedCandidates.size} candidate(s)
//             </p>
//           </div>
//           <button
//             onClick={handleSubmitVotes}
//             disabled={isSubmitting || selectedCandidates.size === 0}
//             className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isSubmitting ? (
//               <>
//                 <Loader className="w-5 h-5 animate-spin" />
//                 <span>Submitting...</span>
//               </>
//             ) : (
//               <>
//                 <span>Submit Votes</span>
//                 <ChevronRight className="w-5 h-5" />
//               </>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }