import { useState } from "react";
import { X, Clock, User, MessageSquare, ArrowRight } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface SwapRequestModalProps {
  targetSlot: any;
  userSlots: any[];
  onClose: () => void;
}

export function SwapRequestModal({ targetSlot, userSlots, onClose }: SwapRequestModalProps) {
  const createSwapRequest = useMutation(api.swaps.createSwapRequest);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlotId) {
      toast.error("Please select one of your slots to offer");
      return;
    }

    setIsLoading(true);
    try {
      await createSwapRequest({
        mySlotId: selectedSlotId as any,
        theirSlotId: targetSlot._id,
        message: message || undefined,
      });
      toast.success("Swap request sent successfully!");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send swap request");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const targetDateTime = formatDateTime(targetSlot.startTime);
  const targetEndTime = formatDateTime(targetSlot.endTime);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative animate-in fade-in-0 zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Swap</h2>
            <p className="text-gray-600">Choose one of your slots to offer in exchange</p>
          </div>

          {/* Target Slot Info */}
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">You want:</span>
            </div>
            <div className="text-purple-800">
              <div className="font-semibold">{targetSlot.title}</div>
              <div className="text-sm">{targetSlot.ownerName}</div>
              <div className="text-sm">{targetDateTime.date} • {targetDateTime.time} - {targetEndTime.time}</div>
              {targetSlot.description && (
                <div className="text-sm mt-1 opacity-80">{targetSlot.description}</div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select your slot to offer *
              </label>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {userSlots.map((slot) => {
                  const slotStart = formatDateTime(slot.startTime);
                  const slotEnd = formatDateTime(slot.endTime);
                  
                  return (
                    <label
                      key={slot._id}
                      className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedSlotId === slot._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedSlot"
                        value={slot._id}
                        checked={selectedSlotId === slot._id}
                        onChange={(e) => setSelectedSlotId(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{slot.title}</div>
                          <div className="text-sm text-gray-600">
                            {slotStart.date} • {slotStart.time} - {slotEnd.time}
                          </div>
                          {slot.description && (
                            <div className="text-sm text-gray-500 mt-1">{slot.description}</div>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedSlotId === slot._id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedSlotId === slot._id && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (Optional)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message to explain why this swap would work well..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedSlotId}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
