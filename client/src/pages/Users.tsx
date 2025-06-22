import React from "react";
import UserList from "@/components/users/UserList";
import AddUserForm from "@/components/users/AddUserForm";

const Users: React.FC = () => {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Users</h3>
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <AddUserForm />
          </div>
        </div>
        
        <UserList />
      </div>
    </div>
  );
};

export default Users;
