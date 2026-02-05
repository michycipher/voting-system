import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import {
  Plus,
  Upload,
  Download,
  Trash2,
  User,
  Loader,
  X,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react';
// import { Voter } from '@/types';
import { Id } from '../../../../convex/_generated/dataModel';

const voterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  surname: z.string().min(1, 'Surname is required'),
  gender: z.string().min(1, 'Gender is required'),
});

type VoterForm = z.infer<typeof voterSchema>;

interface BulkUploadResult {
  name: string;
  uniqueCode: string;
}

interface CSVRow {
  title?: string;
  Title?: string;
  firstName?: string;
  FirstName?: string;
  middleName?: string;
  MiddleName?: string;
  surname?: string;
  Surname?: string;
  gender?: string;
  Gender?: string;
}

export default function VotersManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkUploadResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const voters = useQuery(api.voters.list);
  const voterStats = useQuery(api.voters.getStats);
  const addVoter = useMutation(api.voters.add);
  const bulkAddVoters = useMutation(api.voters.bulkAdd);
  const removeVoter = useMutation(api.voters.remove);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VoterForm>({
    resolver: zodResolver(voterSchema),
  });

  const handleOpenModal = () => {
    reset({
      title: '',
      firstName: '',
      middleName: '',
      surname: '',
      gender: '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit = async (data: VoterForm) => {
    try {
      const result = await addVoter(data);
      toast.success(
        <div>
          <p className="font-semibold">Voter added successfully!</p>
          <p className="text-sm mt-1">Code: {result.uniqueCode}</p>
        </div>
      );
      handleCloseModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add voter';
      toast.error(message);
    }
  };

  const handleDelete = async (id: Id<'voters'>) => {
    if (window.confirm('Are you sure you want to delete this voter?')) {
      try {
        await removeVoter({ id });
        toast.success('Voter deleted successfully');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete voter';
        toast.error(message);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse<CSVRow>(file, {
      header: true,
      complete: async (parseResults) => {
        try {
          const votersData: VoterForm[] = parseResults.data
            .filter((row: CSVRow) => row.firstName || row.FirstName)
            .filter((row: CSVRow) => row.surname || row.Surname)
            .map((row: CSVRow) => ({
              title: row.title || row.Title || '',
              firstName: row.firstName || row.FirstName || '',
              middleName: row.middleName || row.MiddleName || undefined,
              surname: row.surname || row.Surname || '',
              gender: row.gender || row.Gender || '',
            }));

          if (votersData.length === 0) {
            toast.error('No valid voter data found in CSV');
            return;
          }

          const uploadResults = await bulkAddVoters({ voters: votersData });
          setBulkResults(uploadResults);
          setIsBulkModalOpen(true);
          toast.success(`Successfully added ${uploadResults.length} voters`);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to upload voters';
          toast.error(message);
        }
      },
      error: (error) => {
        toast.error('Failed to parse CSV file');
        console.error(error);
      },
    });

    event.target.value = '';
  };

  const downloadTemplate = () => {
    const csv = `title,firstName,middleName,surname,gender
Mr,John,James,Doe,Male
Mrs,Jane,Marie,Smith,Female
Dr,Michael,Peter,Johnson,Male`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voters_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportVoters = () => {
    if (!voters) return;

    const csv = Papa.unparse(
      voters.map((v) => ({
        uniqueCode: v.uniqueCode,
        title: v.title,
        firstName: v.firstName,
        middleName: v.middleName || '',
        surname: v.surname,
        gender: v.gender,
        hasVoted: v.hasVoted ? 'Yes' : 'No',
        votedAt: v.votedAt ? new Date(v.votedAt).toLocaleString() : '',
      }))
    );

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voters_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  
  if (!voters || !voterStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter voters based on search
  const filteredVoters = voters.filter(
    (voter) =>
      voter.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Voters Management
          </h2>
          <p className="text-gray-600">Manage voter registrations and codes</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="btn-outline flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Template</span>
          </button>
          <label className="btn-outline flex items-center space-x-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <button onClick={exportVoters} className="btn-outline flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button onClick={handleOpenModal} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add Voter</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card border-primary">
          <p className="text-sm font-medium text-gray-600">Total Voters</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{voterStats.totalVoters}</p>
        </div>
        <div className="stat-card border-green-500">
          <p className="text-sm font-medium text-gray-600">Voted</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{voterStats.votedCount}</p>
        </div>
        <div className="stat-card border-secondary">
          <p className="text-sm font-medium text-gray-600">Pending</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{voterStats.pendingCount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <input
          type="text"
          placeholder="Search by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input"
        />
      </div>

      {/* Voters Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Gender</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVoters.map((voter) => (
                <tr key={voter._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {voter.uniqueCode}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {voter.title} {voter.firstName}{' '}
                        {voter.middleName && `${voter.middleName} `}
                        {voter.surname}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{voter.gender}</td>
                  <td className="px-4 py-3">
                    {voter.hasVoted ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Voted
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(voter._id)}
                      disabled={voter.hasVoted}
                      className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={voter.hasVoted ? 'Cannot delete voted voter' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVoters.length === 0 && (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No voters found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Voter Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h3 className="text-xl font-display font-bold text-gray-900">Add New Voter</h3>
              <button aria-label="Close modal" onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Title</label>
                  <select className="input" {...register('title')}>
                    <option value="">Select Title</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                    <option value="Prof">Prof</option>
                  </select>
                  {errors.title && (
                    <p className="text-sm text-secondary mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">First Name</label>
                  <input type="text" className="input" {...register('firstName')} />
                  {errors.firstName && (
                    <p className="text-sm text-secondary mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Middle Name (Optional)</label>
                  <input type="text" className="input" {...register('middleName')} />
                </div>

                <div>
                  <label className="label">Surname</label>
                  <input type="text" className="input" {...register('surname')} />
                  {errors.surname && (
                    <p className="text-sm text-secondary mt-1">{errors.surname.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Gender</label>
                  <select className="input" {...register('gender')}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="text-sm text-secondary mt-1">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Voter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Results Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-display font-bold text-gray-900">
                  Voters Added Successfully
                </h3>
              </div>
              <button
              aria-label='Close bulk upload results modal'
                onClick={() => setIsBulkModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-gray-600 mb-4">
                {bulkResults.length} voter(s) have been added. Here are their unique codes:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                        Unique Code
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bulkResults.map((result, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{result.name}</td>
                        <td className="px-4 py-2">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                            {result.uniqueCode}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end">
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}