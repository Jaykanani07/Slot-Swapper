import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Bell, Clock, User, Check, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export function NotificationsView() {
  const incomingRequests = useQuery(api.swaps.getIncomingRequests);
  const outgoingRequests = useQuery(api.swaps.getOutgoingRequests);
  const respondToSwap = useMutation(api.swaps.respondToSwapRequest);
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);

  const handleResponse = async (requestId: string, accept: boolean) => {
    setLoadingRequestId(requestId);
    try {
      await respondToSwap({ requestId: requestId as any, accept });
      toast.success(accept ? "Swap request accepted!" : "Swap request rejected");
    } catch (error) {
      toast.error("Failed to respond to swap request");
    } finally {
      setLoadingRequestId(null);
    }
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!incomingRequests || !outgoingRequests) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const pendingIncoming = incomingRequests.filter(req => req.status === 'PENDING');
  const completedIncoming = incomingRequests.filter(req => req.status !== 'PENDING');

  return (
    <div className="space-y-6">
      {/* Incoming Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Incoming Requests</h2>
            </div>
            {pendingIncoming.length > 0 && (
              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                {pendingIncoming.length} pending
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-2">Swap requests from other users</p>
        </div>

        <div className="p-6">
          {incomingRequests.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No incoming requests</h3>
              <p className="text-gray-600">You'll see swap requests from other users here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map((request) => {
                const requesterStart = formatDateTime(request.requesterSlot?.startTime || 0);
                const requesterEnd = formatDateTime(request.requesterSlot?.endTime || 0);
                const targetStart = formatDateTime(request.targetSlot?.startTime || 0);
                const targetEnd = formatDateTime(request.targetSlot?.endTime || 0);
                
                return (
                  <div
                    key={request._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{request.requesterName}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(request._creationTime).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 items-center">
                      {/* Their Slot */}
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-blue-900 mb-1">They offer:</div>
                        <div className="text-sm text-blue-800">
                          <div className="font-medium">{request.requesterSlot?.title}</div>
                          <div>{requesterStart.date}</div>
                          <div>{requesterStart.time} - {requesterEnd.time}</div>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex justify-center">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>

                      {/* Your Slot */}
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-purple-900 mb-1">For your:</div>
                        <div className="text-sm text-purple-800">
                          <div className="font-medium">{request.targetSlot?.title}</div>
                          <div>{targetStart.date}</div>
                          <div>{targetStart.time} - {targetEnd.time}</div>
                        </div>
                      </div>
                    </div>

                    {request.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Message:</span> {request.message}
                        </div>
                      </div>
                    )}

                    {request.status === 'PENDING' && (
                      <div className="flex space-x-3 mt-4">
                        <button
                          onClick={() => handleResponse(request._id, true)}
                          disabled={loadingRequestId === request._id}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleResponse(request._id, false)}
                          disabled={loadingRequestId === request._id}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Outgoing Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Outgoing Requests</h2>
          </div>
          <p className="text-gray-600 mt-2">Swap requests you've sent to other users</p>
        </div>

        <div className="p-6">
          {outgoingRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No outgoing requests</h3>
              <p className="text-gray-600">Visit the marketplace to request swaps with other users</p>
            </div>
          ) : (
            <div className="space-y-4">
              {outgoingRequests.map((request) => {
                const requesterStart = formatDateTime(request.requesterSlot?.startTime || 0);
                const requesterEnd = formatDateTime(request.requesterSlot?.endTime || 0);
                const targetStart = formatDateTime(request.targetSlot?.startTime || 0);
                const targetEnd = formatDateTime(request.targetSlot?.endTime || 0);
                
                return (
                  <div
                    key={request._id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">To: {request.targetUserName}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(request._creationTime).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 items-center">
                      {/* Your Slot */}
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-blue-900 mb-1">You offered:</div>
                        <div className="text-sm text-blue-800">
                          <div className="font-medium">{request.requesterSlot?.title}</div>
                          <div>{requesterStart.date}</div>
                          <div>{requesterStart.time} - {requesterEnd.time}</div>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex justify-center">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>

                      {/* Their Slot */}
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-purple-900 mb-1">For their:</div>
                        <div className="text-sm text-purple-800">
                          <div className="font-medium">{request.targetSlot?.title}</div>
                          <div>{targetStart.date}</div>
                          <div>{targetStart.time} - {targetEnd.time}</div>
                        </div>
                      </div>
                    </div>

                    {request.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Your message:</span> {request.message}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
