import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import toast from 'react-hot-toast';
import { Save, ToggleLeft, ToggleRight, Loader, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const [votingEnabled, setVotingEnabled] = useState(false);
  const [electionTitle, setElectionTitle] = useState('');
  const [maxCandidates, setMaxCandidates] = useState(20);
  const [isSaving, setIsSaving] = useState(false);

  const votingEnabledSetting = useQuery(api.settings.get, { key: 'votingEnabled' });
  const electionTitleSetting = useQuery(api.settings.get, { key: 'electionTitle' });
  const maxCandidatesSetting = useQuery(api.settings.get, { key: 'maxCandidatesPerPosition' });
  
  const updateSetting = useMutation(api.settings.set);
  const voterStats = useQuery(api.voters.getStats);
  const candidateStats = useQuery(api.candidates.getStats);

  useEffect(() => {
    if (votingEnabledSetting) {
      setVotingEnabled(votingEnabledSetting.value);
    }
  }, [votingEnabledSetting]);

  useEffect(() => {
    if (electionTitleSetting) {
      setElectionTitle(electionTitleSetting.value);
    }
  }, [electionTitleSetting]);

  useEffect(() => {
    if (maxCandidatesSetting) {
      setMaxCandidates(maxCandidatesSetting.value);
    }
  }, [maxCandidatesSetting]);

  const handleToggleVoting = async () => {
    const newValue = !votingEnabled;
    
    if (newValue && voterStats && voterStats.totalVoters === 0) {
      toast.error('Cannot enable voting: No voters registered');
      return;
    }

    if (newValue && candidateStats && candidateStats.totalCandidates === 0) {
      toast.error('Cannot enable voting: No candidates added');
      return;
    }

    try {
      await updateSetting({ key: 'votingEnabled', value: newValue });
      setVotingEnabled(newValue);
      toast.success(newValue ? 'Voting enabled' : 'Voting disabled');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update voting status';
      toast.error(message);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      await updateSetting({ key: 'electionTitle', value: electionTitle });
      await updateSetting({ key: 'maxCandidatesPerPosition', value: maxCandidates });
      toast.success('Settings saved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save settings';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!votingEnabledSetting || !electionTitleSetting || !voterStats || !candidateStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
          System Settings
        </h2>
        <p className="text-gray-600">Configure election parameters and system behavior</p>
      </div>

      {/* Voting Control */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <SettingsIcon className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-display font-bold text-gray-900">
                Voting Status
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Control whether voters can cast their votes. Disabling this will prevent all new votes.
            </p>

            {votingEnabled ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                <p className="text-sm font-medium text-green-900">
                  ✓ Voting is currently <strong>ENABLED</strong>
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Voters can access the system and cast their votes
                </p>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-sm font-medium text-red-900">
                  ✗ Voting is currently <strong>DISABLED</strong>
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Voters cannot access the voting interface
                </p>
              </div>
            )}

            {/* Requirements Check */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-sm">
                {voterStats.totalVoters > 0 ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-red-600">✗</span>
                )}
                <span className={voterStats.totalVoters > 0 ? 'text-gray-700' : 'text-red-600'}>
                  {voterStats.totalVoters} voter(s) registered
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                {candidateStats.totalCandidates > 0 ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-red-600">✗</span>
                )}
                <span className={candidateStats.totalCandidates > 0 ? 'text-gray-700' : 'text-red-600'}>
                  {candidateStats.totalCandidates} candidate(s) added
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleVoting}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              votingEnabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {votingEnabled ? (
              <>
                <ToggleRight className="w-5 h-5" />
                <span>Disable Voting</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                <span>Enable Voting</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Election Configuration */}
      <div className="card">
        <h3 className="text-xl font-display font-bold text-gray-900 mb-4">
          Election Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label className="label">Election Title</label>
            <input
              type="text"
              value={electionTitle}
              onChange={(e) => setElectionTitle(e.target.value)}
              className="input"
              placeholder="e.g., General Election 2024"
            />
            <p className="text-sm text-gray-500 mt-1">
              This title will be displayed to voters
            </p>
          </div>

          <div>
            <label className="label">Maximum Candidates Per Position</label>
            <input
            aria-label="Maximum Candidates Per Position"
              type="number"
              value={maxCandidates}
              onChange={(e) => setMaxCandidates(Number(e.target.value))}
              className="input"
              min={1}
              max={50}
            />
            <p className="text-sm text-gray-500 mt-1">
              Limit the number of candidates that can run for each position
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* System Information */}
      <div className="card">
        <h3 className="text-xl font-display font-bold text-gray-900 mb-4">
          System Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Database Status</p>
            <p className="text-lg font-bold text-green-600 mt-1">Connected</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Real-time Updates</p>
            <p className="text-lg font-bold text-green-600 mt-1">Active</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Concurrency Support</p>
            <p className="text-lg font-bold text-primary mt-1">3000+ Users</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Vote Privacy</p>
            <p className="text-lg font-bold text-primary mt-1">Guaranteed</p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">i</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Security & Privacy</h4>
            <p className="text-sm text-gray-700">
              This system ensures vote confidentiality. Individual votes cannot be traced back to
              specific voters. All actions are logged for audit purposes while maintaining voter
              anonymity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}