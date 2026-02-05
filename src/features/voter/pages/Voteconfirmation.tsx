import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function VoteConfirmation() {
  const navigate = useNavigate();
  const voterName = sessionStorage.getItem('voterName');
  const votedPositions = sessionStorage.getItem('votedPositions');

  useEffect(() => {
    if (!voterName || !votedPositions) {
      navigate('/');
    }
  }, [voterName, votedPositions, navigate]);

  const handleFinish = () => {
    sessionStorage.clear();
    navigate('/');
  };

  if (!voterName || !votedPositions) {
    return null;
  }

  const positions = JSON.parse(votedPositions);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="card text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        <h2 className="md:text-3xl text-2xl font-display font-bold text-gray-900 mb-4">
          Thank You for Voting!
        </h2>

        <p className="text-lg text-gray-700 mb-6">
          <span className='font-bold text-gray-900'>{voterName}</span>, your vote has been successfully recorded.
        </p>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <p className="text-sm text-gray-600 mb-4">You voted for positions:</p>
          <div className="space-y-2">
            {positions.map((position: string) => (
              <div
                key={position}
                className="bg-white px-4 py-2 rounded-lg border border-gray-200"
              >
                <p className="font-medium text-gray-900">{position}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 text-sm text-gray-600">
          <p>
            Your vote is confidential and has been securely recorded. The results will be
            available after voting closes.
          </p>
          <p className="font-medium text-orange-400">
            You cannot vote again with the same code.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <button onClick={handleFinish} className="btn-primary cursor-pointer">
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}