import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="container mt-5">
            <div className="card">
                <div className="card-body">
                    <h1 className="card-title mb-4">Privacy Policy</h1>
                    
                    <section className="mb-4">
                        <p>
                            As this is a personal project, we are committed to protecting your privacy. 
                            No information we collect is shared with any third party.
                        </p>
                    </section>

                    <section className="mb-4">
                        <h2 className="h4">Information We Collect</h2>
                        <ul className="list-unstyled">
                            <li className="mb-2">
                                <strong>Personal Information:</strong> When you create an account, 
                                we collect your email address, username, and a hashed version of your password.
                            </li>
                            <li className="mb-2">
                                <strong>User Generated Content:</strong> When you use your account to create 
                                a list or submit a review, we collect the content of that list or review.
                            </li>
                        </ul>
                    </section>

                    <section className="mb-4">
                        <h2 className="h4">How We Use Your Information</h2>
                        <p>We use your information to:</p>
                        <ul>
                            <li>Authenticate you by verifying your email address and password.</li>
                            <li>Provide our services, such as allowing you to create and share lists and reviews.</li>
                            <li>Verify you, such as by sending a verification email to the email address you provided when you created an account.</li>
                        </ul>
                    </section>

                    <section className="mb-4">
                        <h2 className="h4">Sharing Your Information</h2>
                        <p>We do not share your information with any third parties.</p>
                    </section>

                    <section className="mb-4">
                        <h2 className="h4">Security</h2>
                        <p>
                            We take reasonable measures to protect your personal information from 
                            unauthorized access, disclosure, alteration, and destruction.
                        </p>
                        <p>Passwords are stored hashed and salted.</p>
                    </section>

                    <section className="mb-4">
                        <h2 className="h4">Changes to This Privacy Policy</h2>
                        <p>
                            We may change this privacy policy without notice. The new privacy policy 
                            will be posted on this page.
                        </p>
                    </section>

                    <section className="mb-4">
                        <h2 className="h4">Contact Us</h2>
                        <p>
                            If you have any questions about this privacy policy or our privacy practices, 
                            please contact us at: <a href="mailto:ypadhiar@uwo.ca">ypadhiar@uwo.ca</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
