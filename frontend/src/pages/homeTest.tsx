import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

import { BorderTrail } from '../components/ui/border-trail';

function HomeTest() {
    const [prompt, setPrompt] = useState('');
    const navigate = useNavigate();

    const handleSubmit = () => {
      // e.preventDefault();

        navigate('/builderTest', { state: { prompt } });
    };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-50">
        <div className="text-2xl font-bold italic" style={{ fontFamily: "'Funnel Display', sans-serif"}}>bolt</div>
      </header>

      {/* New Feature Banner */}
      <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50">
        <Button variant="ghost" className="bg-gray-800/50 backdrop-blur-sm text-gray-300 hover:text-white gap-2">
          <Sparkles size={16} />
          New! Introducing Figma to Bolt
        </Button>
      </div>

      {/* Main Content */}
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4">
            What do you want to build?
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Prompt, run, edit, and deploy full-stack <span className="text-white">web</span> and <span className="text-white">mobile</span> apps.
          </p>

          {/* Input Box */}
            <form 
              className="max-w-2xl mx-auto">
              <div className="relative h-[120px] w-full overflow-hidden rounded-md border border-zinc-800 bg-gray-900/50 backdrop-blur-sm text-zinc-300">
              <textarea 
                className="h-full w-full resize-none rounded-md bg-transparent px-4 py-4 text-sm outline-none" 
                placeholder="How can Bolt help you today?"
                style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.7)' }}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleSubmit();
                  }
                }}
              />
              <BorderTrail
                className="bg-gradient-to-l from-blue-400/20 via-blue-500/40 to-blue-400/20"
                size={120}
              />
              </div>

            </form>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            <Button 
              className="bg-gray-800 hover:bg-gray-700" 
              onClick={() => {
              setPrompt('Build a Todo Application');
              handleSubmit();
              }}
            >
              Build a Todo Application
            </Button>
            <Button className="bg-gray-800 hover:bg-gray-700">Build a payment Dashboard</Button>
            <Button className="bg-gray-800 hover:bg-gray-700">Start a blog Page</Button>
          </div>

          {/* Secondary Buttons */}
          {/* <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Button variant="ghost" className="text-gray-400 hover:text-white">Create a docs site with Vitepress</Button>
            <Button variant="ghost" className="text-gray-400 hover:text-white">Scaffold UI with shadcn</Button>
            <Button variant="ghost" className="text-gray-400 hover:text-white">Draft a presentation with Slidev</Button>
          </div> */}

          {/* Footer Text */}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 flex justify-between items-center text-gray-500">
        <div className="flex items-center gap-4">
          <button className="hover:text-white">Help Center</button>
          <button className="hover:text-white">Careers</button>
          <button className="hover:text-white">Terms</button>
          <button className="hover:text-white">Privacy</button>
        </div>
        <div className="flex items-center gap-2">
          <span>StackBlitz</span>
        </div>
      </footer>
    </div>
  );
}

export default HomeTest;