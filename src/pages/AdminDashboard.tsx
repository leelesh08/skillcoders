import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlowCard from '@/components/GlowCard';
import GlowButton from '@/components/GlowButton';

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
          <div className="grid md:grid-cols-3 gap-6">
            <GlowCard className="p-6">
              <h3 className="text-lg font-semibold mb-2">Users</h3>
              <p className="text-sm text-muted-foreground mb-4">Manage users, roles and claims.</p>
              <Link to="/admin/users"><GlowButton>Open Users</GlowButton></Link>
            </GlowCard>

            <GlowCard className="p-6">
              <h3 className="text-lg font-semibold mb-2">Courses</h3>
              <p className="text-sm text-muted-foreground mb-4">Create and update courses.</p>
              <Link to="/admin/courses"><GlowButton>Open Courses</GlowButton></Link>
            </GlowCard>

            <GlowCard className="p-6">
              <h3 className="text-lg font-semibold mb-2">Orders & Invoices</h3>
              <p className="text-sm text-muted-foreground mb-4">Fulfill orders and download invoices.</p>
              <Link to="/admin/audits"><GlowButton>Open Audits</GlowButton></Link>
            </GlowCard>

            <GlowCard className="p-6">
              <h3 className="text-lg font-semibold mb-2">Battles</h3>
              <p className="text-sm text-muted-foreground mb-4">Manage battles, winners and payouts.</p>
              <Link to="/admin/battles"><GlowButton>Open Battles</GlowButton></Link>
            </GlowCard>

            <GlowCard className="p-6">
              <h3 className="text-lg font-semibold mb-2">Quizzes</h3>
              <p className="text-sm text-muted-foreground mb-4">Create and remove quizzes.</p>
              <Link to="/admin/quizzes"><GlowButton>Open Quizzes</GlowButton></Link>
            </GlowCard>

            <GlowCard className="p-6">
              <h3 className="text-lg font-semibold mb-2">Instructors</h3>
              <p className="text-sm text-muted-foreground mb-4">Approve/deny instructor applications.</p>
              <Link to="/admin/instructors"><GlowButton>Open Instructors</GlowButton></Link>
            </GlowCard>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
