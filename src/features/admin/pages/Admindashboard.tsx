import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Users, UserCheck, Vote, TrendingUp, Loader } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const candidateStats = useQuery(api.candidates.getStats);
  const voterStats = useQuery(api.voters.getStats);
  const results = useQuery(api.votes.getResults);
  const votingActivity = useQuery(api.voters.getVotingActivity);

  if (!candidateStats || !voterStats || !results) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Candidates',
      value: candidateStats.totalCandidates,
      icon: Users,
      color: 'border-primary',
      bgColor: 'bg-primary/10',
      textColor: 'text-primary',
    },
    {
      name: 'Total Voters',
      value: voterStats.totalVoters,
      icon: UserCheck,
      color: 'border-secondary',
      bgColor: 'bg-secondary/10',
      textColor: 'text-secondary',
    },
    {
      name: 'Votes Cast',
      value: voterStats.votedCount,
      icon: Vote,
      color: 'border-neutral',
      bgColor: 'bg-neutral/10',
      textColor: 'text-neutral',
    },
    {
      name: 'Voter Turnout',
      value: `${voterStats.turnoutPercentage.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'border-primary-light',
      bgColor: 'bg-primary-light/10',
      textColor: 'text-primary-light',
    },
  ];

  // Prepare data for position results chart
  const positionData = candidateStats.byPosition.map((pos) => ({
    position: pos.position.length > 15 ? pos.position.substring(0, 15) + '...' : pos.position,
    votes: pos.totalVotes,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
          Dashboard Overview
        </h2>
        <p className="text-gray-600">Real-time election statistics and monitoring</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className={`stat-card ${stat.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Votes by Position */}
        <div className="card">
          <h3 className="text-lg font-display font-bold text-gray-900 mb-4">
            Votes by Position
          </h3>
          {positionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={positionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="position"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="votes" fill="#1E40AF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No voting data yet
            </div>
          )}
        </div>

        {/* Voter Participation */}
        <div className="card">
          <h3 className="text-lg font-display font-bold text-gray-900 mb-4">
            Voter Participation
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Voted', value: voterStats.votedCount },
                  { name: 'Pending', value: voterStats.pendingCount },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent != null ? (percent * 100).toFixed(0) : 0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#1E40AF" />
                <Cell fill="#DC2626" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Voting Activity Timeline */}
      {votingActivity && votingActivity.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-display font-bold text-gray-900 mb-4">
            Voting Activity Over Time
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={votingActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getHours()}:00`;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(value) => new Date(value as string | number).toLocaleString()}
              />
              <Bar dataKey="count" fill="#64748B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Stats by Position */}
      <div className="card">
        <h3 className="text-lg font-display font-bold text-gray-900 mb-4">
          Position Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Position
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Candidates
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Total Votes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {candidateStats.byPosition.map((pos, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {pos.position}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {pos.candidateCount}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {pos.totalVotes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// import { useQuery } from 'convex/react';
// import { api } from '../../../../convex/_generated/api';
// import { Users, UserCheck, Vote, TrendingUp, Loader } from 'lucide-react';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// const COLORS = ['#1E40AF', '#DC2626', '#64748B', '#3B82F6', '#EF4444'];

// export default function AdminDashboard() {
//   const candidateStats = useQuery(api.candidates.getStats);
//   const voterStats = useQuery(api.voters.getStats);
//   const results = useQuery(api.votes.getResults);
//   const votingActivity = useQuery(api.voters.getVotingActivity);

//   if (!candidateStats || !voterStats || !results) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <Loader className="w-8 h-8 animate-spin text-primary" />
//       </div>
//     );
//   }

//   const stats = [
//     {
//       name: 'Total Candidates',
//       value: candidateStats.totalCandidates,
//       icon: Users,
//       color: 'border-primary',
//       bgColor: 'bg-primary/10',
//       textColor: 'text-primary',
//     },
//     {
//       name: 'Total Voters',
//       value: voterStats.totalVoters,
//       icon: UserCheck,
//       color: 'border-secondary',
//       bgColor: 'bg-secondary/10',
//       textColor: 'text-secondary',
//     },
//     {
//       name: 'Votes Cast',
//       value: voterStats.votedCount,
//       icon: Vote,
//       color: 'border-neutral',
//       bgColor: 'bg-neutral/10',
//       textColor: 'text-neutral',
//     },
//     {
//       name: 'Voter Turnout',
//       value: `${voterStats.turnoutPercentage.toFixed(1)}%`,
//       icon: TrendingUp,
//       color: 'border-primary-light',
//       bgColor: 'bg-primary-light/10',
//       textColor: 'text-primary-light',
//     },
//   ];

//   // Prepare data for position results chart
//   const positionData = candidateStats.byPosition.map((pos) => ({
//     position: pos.position.length > 15 ? pos.position.substring(0, 15) + '...' : pos.position,
//     votes: pos.totalVotes,
//   }));

//   return (
//     <div className="space-y-8 animate-fade-in">
//       <div>
//         <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
//           Dashboard Overview
//         </h2>
//         <p className="text-gray-600">Real-time election statistics and monitoring</p>
//       </div>

//       {/* Statistics Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//         {stats.map((stat) => (
//           <div key={stat.name} className={`stat-card ${stat.color}`}>
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">{stat.name}</p>
//                 <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
//               </div>
//               <div className={`p-3 rounded-lg ${stat.bgColor}`}>
//                 <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Charts Row */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Votes by Position */}
//         <div className="card">
//           <h3 className="text-lg font-display font-bold text-gray-900 mb-4">
//             Votes by Position
//           </h3>
//           {positionData.length > 0 ? (
//             <ResponsiveContainer width="100%" height={300}>
//               <BarChart data={positionData}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
//                 <XAxis
//                   dataKey="position"
//                   tick={{ fontSize: 12 }}
//                   angle={-45}
//                   textAnchor="end"
//                   height={80}
//                 />
//                 <YAxis tick={{ fontSize: 12 }} />
//                 <Tooltip />
//                 <Bar dataKey="votes" fill="#1E40AF" radius={[8, 8, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           ) : (
//             <div className="flex items-center justify-center h-[300px] text-gray-500">
//               No voting data yet
//             </div>
//           )}
//         </div>

//         {/* Voter Participation */}
//         <div className="card">
//           <h3 className="text-lg font-display font-bold text-gray-900 mb-4">
//             Voter Participation
//           </h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <PieChart>
//               <Pie
//                 data={[
//                   { name: 'Voted', value: voterStats.votedCount },
//                   { name: 'Pending', value: voterStats.pendingCount },
//                 ]}
//                 cx="50%"
//                 cy="50%"
//                 labelLine={false}
//                 label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                 outerRadius={100}
//                 fill="#8884d8"
//                 dataKey="value"
//               >
//                 <Cell fill="#1E40AF" />
//                 <Cell fill="#DC2626" />
//               </Pie>
//               <Tooltip />
//             </PieChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       {/* Voting Activity Timeline */}
//       {votingActivity && votingActivity.length > 0 && (
//         <div className="card">
//           <h3 className="text-lg font-display font-bold text-gray-900 mb-4">
//             Voting Activity Over Time
//           </h3>
//           <ResponsiveContainer width="100%" height={200}>
//             <BarChart data={votingActivity}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
//               <XAxis
//                 dataKey="time"
//                 tick={{ fontSize: 12 }}
//                 tickFormatter={(value) => {
//                   const date = new Date(value);
//                   return `${date.getHours()}:00`;
//                 }}
//               />
//               <YAxis tick={{ fontSize: 12 }} />
//               <Tooltip
//                 labelFormatter={(value) => new Date(value).toLocaleString()}
//               />
//               <Bar dataKey="count" fill="#64748B" radius={[8, 8, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       )}

//       {/* Quick Stats by Position */}
//       <div className="card">
//         <h3 className="text-lg font-display font-bold text-gray-900 mb-4">
//           Position Breakdown
//         </h3>
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
//                   Position
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
//                   Candidates
//                 </th>
//                 <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
//                   Total Votes
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {candidateStats.byPosition.map((pos, index) => (
//                 <tr key={index} className="hover:bg-gray-50">
//                   <td className="px-4 py-3 text-sm font-medium text-gray-900">
//                     {pos.position}
//                   </td>
//                   <td className="px-4 py-3 text-sm text-gray-600">
//                     {pos.candidateCount}
//                   </td>
//                   <td className="px-4 py-3 text-sm text-gray-600">
//                     {pos.totalVotes}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }