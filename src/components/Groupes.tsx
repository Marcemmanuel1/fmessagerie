import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiUsers,
  FiPlus,
  FiSearch,
  FiArrowLeft,
  FiCheck,
  FiUserPlus,
  FiUserMinus,
} from "react-icons/fi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface User {
  id: number;
  name: string;
  avatar: string;
  status: string;
}

interface Group {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  created_by_name: string;
  created_by_avatar: string;
  member_count: number;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  is_admin?: boolean;
}

interface GroupDetails extends Group {
  members: {
    id: number;
    name: string;
    avatar: string;
    status: string;
    is_admin: boolean;
  }[];
}

interface Message {
  id: number;
  content: string;
  created_at: string;
  sender_id: number;
  sender_name: string;
  sender_avatar: string;
}

const Groupes = () => {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [view, setView] = useState<"list" | "details" | "chat">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        "https://backend-kmrt.onrender.com/api/groups",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setGroups(data.groups);
      }
    } catch (err) {
      console.error("Erreur de chargement des groupes:", err);
      toast.error("Erreur de chargement des groupes");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "https://backend-kmrt.onrender.com/api/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Erreur de chargement des utilisateurs:", err);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, [fetchGroups, fetchUsers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedUsers.length === 0) {
      toast.error("Nom du groupe et au moins un membre sont requis");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        "https://backend-kmrt.onrender.com/api/groups",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newGroupName,
            description: newGroupDescription,
            members: selectedUsers,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Groupe créé avec succès");
        setGroups((prev) => [data.group, ...prev]);
        setShowCreateModal(false);
        setNewGroupName("");
        setNewGroupDescription("");
        setSelectedUsers([]);
      } else {
        toast.error(data.message || "Erreur lors de la création du groupe");
      }
    } catch (err) {
      console.error("Erreur création groupe:", err);
      toast.error("Erreur lors de la création du groupe");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (groupId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://backend-kmrt.onrender.com/api/groups/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setSelectedGroup(data.group);
        setView("details");
      } else {
        toast.error(data.message || "Erreur de chargement des détails");
      }
    } catch (err) {
      console.error("Erreur détails groupe:", err);
      toast.error("Erreur de chargement des détails");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMessages = async (groupId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://backend-kmrt.onrender.com/api/groups/${groupId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        setView("chat");
      }
    } catch (err) {
      console.error("Erreur messages groupe:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://backend-kmrt.onrender.com/api/groups/${groupId}/leave`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Vous avez quitté le groupe");
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
        setSelectedGroup(null);
        setView("list");
      } else {
        toast.error(data.message || "Erreur lors de la sortie du groupe");
      }
    } catch (err) {
      console.error("Erreur quitter groupe:", err);
      toast.error("Erreur lors de la sortie du groupe");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://backend-kmrt.onrender.com/api/groups/${groupId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Groupe supprimé avec succès");
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
        setSelectedGroup(null);
        setView("list");
      } else {
        toast.error(data.message || "Erreur lors de la suppression du groupe");
      }
    } catch (err) {
      console.error("Erreur suppression groupe:", err);
      toast.error("Erreur lors de la suppression du groupe");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Sélectionnez au moins un membre");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://backend-kmrt.onrender.com/api/groups/${selectedGroup?.id}/members`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            members: selectedUsers,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Membres ajoutés avec succès");
        if (selectedGroup) {
          const updatedGroup = {
            ...selectedGroup,
            members: [
              ...selectedGroup.members,
              ...data.addedMembers.map((user: any) => ({
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                status: user.status,
                is_admin: false,
              })),
            ],
            member_count: selectedGroup.member_count + data.addedMembers.length,
          };
          setSelectedGroup(updatedGroup);
        }
        setShowAddMembersModal(false);
        setSelectedUsers([]);
      } else {
        toast.error(data.message || "Erreur lors de l'ajout des membres");
      }
    } catch (err) {
      console.error("Erreur ajout membres:", err);
      toast.error("Erreur lors de l'ajout des membres");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://backend-kmrt.onrender.com/api/groups/${selectedGroup?.id}/members/${memberId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Membre supprimé du groupe");
        if (selectedGroup) {
          const updatedGroup = {
            ...selectedGroup,
            members: selectedGroup.members.filter((m) => m.id !== memberId),
            member_count: selectedGroup.member_count - 1,
          };
          setSelectedGroup(updatedGroup);
        }
      } else {
        toast.error(data.message || "Erreur lors de la suppression du membre");
      }
    } catch (err) {
      console.error("Erreur suppression membre:", err);
      toast.error("Erreur lors de la suppression du membre");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedGroup) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://backend-kmrt.onrender.com/api/groups/${selectedGroup.id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: input,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setInput("");
      }
    } catch (err) {
      console.error("Erreur envoi message:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase())
  );

  const availableUsers = users.filter(
    (user) =>
      !selectedGroup?.members.some((member) => member.id === user.id) &&
      user.id !== selectedGroup?.created_by
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
        {view !== "list" ? (
          <button
            onClick={() => {
              if (view === "details") {
                setView("list");
              } else {
                setView("details");
              }
              setSelectedGroup(null);
            }}
            className="text-gray-600 hover:text-indigo-600"
          >
            <FiArrowLeft size={20} />
          </button>
        ) : (
          <h2 className="text-xl font-semibold text-gray-800">Groupes</h2>
        )}
        <div className="flex items-center space-x-4">
          {view === "list" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
              title="Créer un groupe"
            >
              <FiPlus size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Group List View */}
      {view === "list" && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sticky top-0 bg-white z-10 border-b border-gray-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher des groupes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition shadow-sm"
              />
            </div>
          </div>

          {loading && filteredGroups.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {search ? "Aucun groupe trouvé" : "Aucun groupe disponible"}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => fetchGroupDetails(group.id)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="flex items-center">
                    <div className="relative mr-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <FiUsers size={20} />
                      </div>
                      {group.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {group.unread_count}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {group.name}
                        </h3>
                        {group.last_message_time && (
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {new Date(group.last_message_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm text-gray-500 truncate">
                          {group.last_message || "Aucun message"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Group Details View */}
      {view === "details" && selectedGroup && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <h2 className="text-xl font-bold">{selectedGroup.name}</h2>
              <p className="text-indigo-100">{selectedGroup.description}</p>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Créé par
                </h3>
                <div className="flex items-center">
                  <img
                    src={
                      selectedGroup.created_by_avatar
                        ? `https://backend-kmrt.onrender.com${selectedGroup.created_by_avatar}`
                        : "https://backend-kmrt.onrender.com/uploads/avatars/default.jpg"
                    }
                    alt={selectedGroup.created_by_name}
                    className="w-10 h-10 rounded-full object-cover mr-3"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://backend-kmrt.onrender.com/uploads/avatars/default.jpg";
                    }}
                  />
                  <div>
                    <h4 className="font-medium">{selectedGroup.created_by_name}</h4>
                    <p className="text-xs text-gray-500">Créateur</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Membres ({selectedGroup.member_count})
                  </h3>
                  {selectedGroup.is_admin && (
                    <button
                      onClick={() => setShowAddMembersModal(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      <FiUserPlus className="mr-1" /> Ajouter
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {selectedGroup.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="relative mr-3">
                          <img
                            src={
                              member.avatar
                                ? `https://backend-kmrt.onrender.com${member.avatar}`
                                : "https://backend-kmrt.onrender.com/uploads/avatars/default.jpg"
                            }
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://backend-kmrt.onrender.com/uploads/avatars/default.jpg";
                            }}
                          />
                          <div
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                              member.status === "En ligne"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          />
                        </div>
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <p className="text-xs text-gray-500">
                            {member.is_admin ? "Administrateur" : "Membre"}
                          </p>
                        </div>
                      </div>
                      {(selectedGroup.is_admin || member.id === selectedGroup.created_by) && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={member.id === selectedGroup.created_by}
                          className={`text-gray-400 hover:text-red-500 transition ${
                            member.id === selectedGroup.created_by
                              ? "cursor-not-allowed opacity-50"
                              : ""
                          }`}
                          title={
                            member.id === selectedGroup.created_by
                              ? "Le créateur ne peut pas être supprimé"
                              : "Supprimer du groupe"
                          }
                        >
                          <FiUserMinus size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex space-x-3">
                <button
                  onClick={() => fetchGroupMessages(selectedGroup.id)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex-1"
                >
                  Voir les messages
                </button>
                {selectedGroup.is_admin ? (
                  <button
                    onClick={() => handleDeleteGroup(selectedGroup.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex-1"
                  >
                    Supprimer le groupe
                  </button>
                ) : (
                  <button
                    onClick={() => handleLeaveGroup(selectedGroup.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex-1"
                  >
                    Quitter le groupe
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Chat View */}
      {view === "chat" && selectedGroup && (
        <div className="flex flex-col h-full">
          <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setView("details")}
              className="text-gray-600 hover:text-indigo-600"
            >
              <FiArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-medium">{selectedGroup.name}</h2>
            <button
              onClick={() => setView("details")}
              className="text-gray-600 hover:text-indigo-600"
            >
              <BsThreeDotsVertical size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender_id === selectedGroup.created_by
                    ? "justify-start"
                    : "justify-end"
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    msg.sender_id === selectedGroup.created_by
                      ? "bg-white text-gray-800 rounded-bl-none shadow-sm"
                      : "bg-indigo-600 text-white rounded-br-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <div className="flex items-center justify-end mt-1 space-x-1 text-xs">
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Écrire un message..."
                className="flex-1 bg-transparent outline-none text-sm px-2 py-1"
              />
              {loading ? (
                <div className="ml-2 p-2">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={input.trim() === ""}
                  className={`ml-2 p-2 rounded-full transition shadow-md ${
                    input.trim() === ""
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Créer un nouveau groupe
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du groupe *
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nom du groupe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Description du groupe (optionnel)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ajouter des membres *
                  </label>
                  <div className="border border-gray-300 rounded-md p-2 max-h-60 overflow-y-auto">
                    {users.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        Chargement des utilisateurs...
                      </p>
                    ) : (
                      users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => toggleUserSelection(user.id)}
                        >
                          <div className="relative mr-3">
                            <img
                              src={
                                user.avatar
                                  ? `https://backend-kmrt.onrender.com${user.avatar}`
                                  : "https://backend-kmrt.onrender.com/uploads/avatars/default.jpg"
                              }
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://backend-kmrt.onrender.com/uploads/avatars/default.jpg";
                              }}
                            />
                            <div
                              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                user.status === "En ligne"
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{user.name}</h4>
                          </div>
                          {selectedUsers.includes(user.id) ? (
                            <FiCheck className="text-green-500" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewGroupName("");
                    setNewGroupDescription("");
                    setSelectedUsers([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={loading || !newGroupName.trim() || selectedUsers.length === 0}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    loading || !newGroupName.trim() || selectedUsers.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {loading ? "Création..." : "Créer le groupe"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembersModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Ajouter des membres à {selectedGroup.name}
              </h3>
              <div className="space-y-4">
                <div className="border border-gray-300 rounded-md p-2 max-h-60 overflow-y-auto">
                  {availableUsers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Tous vos contacts sont déjà dans ce groupe
                    </p>
                  ) : (
                    availableUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => toggleUserSelection(user.id)}
                      >
                        <div className="relative mr-3">
                          <img
                            src={
                              user.avatar
                                ? `https://backend-kmrt.onrender.com${user.avatar}`
                                : "https://backend-kmrt.onrender.com/uploads/avatars/default.jpg"
                            }
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://backend-kmrt.onrender.com/uploads/avatars/default.jpg";
                            }}
                          />
                          <div
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                              user.status === "En ligne"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{user.name}</h4>
                        </div>
                        {selectedUsers.includes(user.id) ? (
                          <FiCheck className="text-green-500" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddMembersModal(false);
                    setSelectedUsers([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddMembers}
                  disabled={loading || selectedUsers.length === 0}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    loading || selectedUsers.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {loading ? "Ajout..." : "Ajouter les membres"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groupes;