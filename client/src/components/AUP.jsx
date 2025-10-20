import React from 'react';

const AUP = () => {
    return (
        <div className="container mt-5">
            <div className="card">
                <div className="card-body">
                    <h1 className="card-title mb-4">Acceptable Use Policy</h1>
                    
                    <section className="mb-4">
                        <p>
                            This Acceptable Use Policy (AUP) outlines the rules and guidelines for using our application. 
                            By using our application, you agree to comply with this AUP.
                        </p>
                    </section>

                    <section className="mb-4">
                        <h2 className="h4">Acceptable Use</h2>
                        <ul className="list-unstyled">
                            <li className="mb-3">
                                <strong>Content Generation:</strong> You may create and share lists with names 
                                and descriptions, as well as reviews with text. The content you generate on the 
                                service should be respectful, relevant, and free of hate speech, harassment, 
                                or personal attacks.
                            </li>
                            <li className="mb-3">
                                <strong>No Spam or Malicious Behavior:</strong> You may not use the service 
                                to promote spam, malicious behavior, or any other activity that may harm or 
                                disrupt the service or its users.
                            </li>
                            <li className="mb-3">
                                <strong>Legal Compliance:</strong> You agree to use the application in 
                                compliance with all applicable laws and regulations.
                            </li>
                        </ul>
                    </section>

                    <section className="mb-4">
                        <h2 className="h4">Unacceptable Use</h2>
                        <ul className="list-unstyled">
                            <li className="mb-3">
                                <strong>Illegal Activities:</strong> You may not use the service to promote 
                                illegal activities, such as terrorism, violence, or any other activity that 
                                may harm or disrupt the service or its users.
                            </li>
                            <li className="mb-3">
                                <strong>Harmful Content:</strong> You may not use the service to promote or 
                                distribute harmful content, such as hate speech, harassment, or any other 
                                activity that may harm or disrupt the service or its users.
                            </li>
                            <li className="mb-3">
                                <strong>Privacy Violations:</strong> You may not share or disclose personal 
                                information of others without their consent.
                            </li>
                        </ul>
                    </section>

                    <section className="mb-4">
                        <h2 className="h4">Consequences of Violation</h2>
                        <p>
                            As a consequence of violating the Acceptable Use Policy, we may hide content, 
                            disable accounts, or take other appropriate measures to protect the service 
                            and its users.
                        </p>
                    </section>

                    <section className="mb-4">
                        <h2 className="h4">Contact</h2>
                        <p>
                            If you have any questions about this Acceptable Use Policy, please contact us at: {' '}
                            <a href="mailto:ypadhiar@uwo.ca">ypadhiar@uwo.ca</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AUP;
