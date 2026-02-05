import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, User, Loader, X } from 'lucide-react';
import { Candidate } from '@/types';
import { Id } from '../../../../convex/_generated/dataModel';

const candidateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  surname: z.string().min(1, 'Surname is required'),
  position: z.string().min(1, 'Position is required'),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  biography: z.string().optional(),
});

type CandidateForm = z.infer<typeof candidateSchema>;

export default function CandidatesManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  const candidates = useQuery(api.candidates.list);
  const addCandidate = useMutation(api.candidates.add);
  const updateCandidate = useMutation(api.candidates.update);
  const removeCandidate = useMutation(api.candidates.remove);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema),
  });

  const handleOpenModal = (candidate?: Candidate) => {
    if (candidate) {
      setEditingCandidate(candidate);
      reset({
        title: candidate.title,
        firstName: candidate.firstName,
        middleName: candidate.middleName || '',
        surname: candidate.surname,
        position: candidate.position,
        imageUrl: candidate.imageUrl || '',
        biography: candidate.biography || '',
      });
    } else {
      setEditingCandidate(null);
      reset({
        title: '',
        firstName: '',
        middleName: '',
        surname: '',
        position: '',
        imageUrl: '',
        biography: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCandidate(null);
    reset();
  };

  const onSubmit = async (data: CandidateForm) => {
    try {
      if (editingCandidate) {
        await updateCandidate({
          id: editingCandidate._id,
          ...data,
          imageUrl: data.imageUrl || undefined,
          biography: data.biography || undefined,
        });
        toast.success('Candidate updated successfully');
      } else {
        await addCandidate({
          ...data,
          imageUrl: data.imageUrl || undefined,
          biography: data.biography || undefined,
        });
        toast.success('Candidate added successfully');
      }
      handleCloseModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save candidate';
      toast.error(message);
    }
  };

  const handleDelete = async (id: Id<'candidates'>) => {
    if (window.confirm('Are you sure you want to delete this candidate?')) {
      try {
        await removeCandidate({ id });
        toast.success('Candidate deleted successfully');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete candidate';
        toast.error(message);
      }
    }
  };

  if (!candidates) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group candidates by position
  const candidatesByPosition = candidates.reduce((acc, candidate) => {
    if (!acc[candidate.position]) {
      acc[candidate.position] = [];
    }
    acc[candidate.position].push(candidate);
    return acc;
  }, {} as Record<string, Candidate[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Candidates Management
          </h2>
          <p className="text-gray-600">Add, edit, or remove election candidates</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card border-primary">
          <p className="text-sm font-medium text-gray-600">Total Candidates</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{candidates.length}</p>
        </div>
        <div className="stat-card border-secondary">
          <p className="text-sm font-medium text-gray-600">Positions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {Object.keys(candidatesByPosition).length}
          </p>
        </div>
        <div className="stat-card border-neutral">
          <p className="text-sm font-medium text-gray-600">Total Votes</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {candidates.reduce((sum, c) => sum + c.voteCount, 0)}
          </p>
        </div>
      </div>

      {/* Candidates by Position */}
      {Object.entries(candidatesByPosition).map(([position, positionCandidates]) => (
        <div key={position} className="card">
          <h3 className="text-xl font-display font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
            {position} ({positionCandidates.length} candidate{positionCandidates.length !== 1 ? 's' : ''})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {positionCandidates.map((candidate) => (
              <div key={candidate._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  {candidate.imageUrl ? (
                    <img
                      src={candidate.imageUrl}
                      alt={`${candidate.firstName} ${candidate.surname}`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {candidate.title} {candidate.firstName}{' '}
                      {candidate.middleName && `${candidate.middleName} `}
                      {candidate.surname}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Votes: <span className="font-semibold">{candidate.voteCount}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 mt-4">
                  <button
                    onClick={() => handleOpenModal(candidate)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(candidate._id)}
                    className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {candidates.length === 0 && (
        <div className="card text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first candidate</p>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            Add Candidate
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-display font-bold text-gray-900">
                {editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}
              </h3>
              <button
                aria-label="Close Modal"
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
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
              </div>

              <div>
                <label className="label">Position</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., President, Vice President"
                  {...register('position')}
                />
                {errors.position && (
                  <p className="text-sm text-secondary mt-1">{errors.position.message}</p>
                )}
              </div>

              <div>
                <label className="label">Image URL (Optional)</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://example.com/image.jpg"
                  {...register('imageUrl')}
                />
                {errors.imageUrl && (
                  <p className="text-sm text-secondary mt-1">{errors.imageUrl.message}</p>
                )}
              </div>

              <div>
                <label className="label">Biography (Optional)</label>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="Brief description of the candidate..."
                  {...register('biography')}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingCandidate ? 'Update Candidate' : 'Add Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}