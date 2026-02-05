import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Loader, TrendingUp, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#1E40AF', '#DC2626', '#64748B', '#3B82F6', '#EF4444', '#94A3B8'];

export default function LiveResults() {
  const results = useQuery(api.votes.getResults);
  const voterStats = useQuery(api.voters.getStats);

  if (!results || !voterStats) {
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
          Live Election Results
        </h2>
        <p className="text-gray-600">Real-time voting results and statistics</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card border-primary">
          <p className="text-sm font-medium text-gray-600">Total Votes Cast</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{voterStats.votedCount}</p>
        </div>
        <div className="stat-card border-secondary">
          <p className="text-sm font-medium text-gray-600">Voter Turnout</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {voterStats.turnoutPercentage.toFixed(1)}%
          </p>
        </div>
        <div className="stat-card border-neutral">
          <p className="text-sm font-medium text-gray-600">Remaining Voters</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{voterStats.pendingCount}</p>
        </div>
      </div>

      {/* Results by Position */}
      {results.map((positionResult) => {
        const chartData = positionResult.candidates.map((c) => ({
          name:
            c.name.length > 20
              ? c.name.substring(0, 20) + '...'
              : c.name,
          fullName: c.name,
          votes: c.voteCount,
        }));

        const winner = positionResult.candidates[0];

        return (
          <div key={positionResult.position} className="card">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-display font-bold text-gray-900">
                {positionResult.position}
              </h3>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Votes</p>
                <p className="text-2xl font-bold text-primary">
                  {positionResult.totalVotes}
                </p>
              </div>
            </div>

            {positionResult.totalVotes > 0 ? (
              <>
                {/* Winner Highlight */}
                {winner && winner.voteCount > 0 && (
                  <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-full">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Current Leader</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-lg font-bold text-gray-900">{winner.name}</p>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {winner.voteCount}
                            </p>
                            <p className="text-sm text-gray-600">
                              {winner.percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chart */}
                <div className="mb-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload[0]) {
                            return (
                              <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                <p className="font-semibold text-gray-900">
                                  {payload[0].payload.fullName}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Votes: {payload[0].value}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="votes" radius={[0, 8, 8, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Detailed Results Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Candidate
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          Votes
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          Percentage
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Progress
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {positionResult.candidates.map((candidate, index) => (
                        <tr key={candidate.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                index === 0
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              {candidate.imageUrl ? (
                                <img
                                  src={candidate.imageUrl}
                                  alt={candidate.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <span className="font-medium text-gray-900">
                                {candidate.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {candidate.voteCount}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {candidate.percentage.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${candidate.percentage}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No votes cast yet for this position</p>
              </div>
            )}
          </div>
        );
      })}

      {results.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-2">No positions available</p>
          <p className="text-sm text-gray-400">Add candidates to see results</p>
        </div>
      )}
    </div>
  );
}